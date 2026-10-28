
const $ = (id) => document.getElementById(id);

function showErr(msg) { const e = $('err'); e.textContent = msg; e.style.display = 'block'; }

async function startPayment() {
  $('err').style.display = 'none';
  const prn = $('prn').value.trim().toUpperCase();
  const name = $('name').value.trim();
  const phone = $('phone').value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const branch = $('branch').value;
  if (!/^[A-Z0-9]{6,20}$/.test(prn)) return showErr('सही PRN डालें (सिर्फ़ letters और numbers).');
  if (name.length < 3) return showErr('अपना पूरा नाम डालें।');
  if (!/^[6-9]\d{9}$/.test(phone)) return showErr('सही 10 अंकों का mobile number डालें।');
  if (!branch) return showErr('अपनी branch चुनें।');
  const sel = document.querySelector('input[name=track]:checked');
  if (!sel) return showErr('अपनी competition category चुनें।');

  const btn = $('payBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  try {
    const res = await fetch('/api/event?action=register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'swayam', prn, name, phone, branch, track: sel.value })
    });
    const data = await res.json();
    if (res.status === 403) { closeRegistration(); return; }
    if (!res.ok) throw new Error(data.message || 'Could not start payment.');
    const cashfree = await Cashfree({ mode: 'production' });
    cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: '_self' });
  } catch (e) {
    showErr(e.message || 'Something went wrong.');
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock"></i> Register करें और ₹20 pay करें';
  }
}

function toggleAlready() {
  const box = $('alreadyBox');
  box.style.display = box.style.display === 'block' ? 'none' : 'block';
  if (box.style.display === 'block') $('aPrn').focus();
}

async function checkRegistered() {
  const e = $('aErr'); e.style.display = 'none';
  const prn = $('aPrn').value.trim().toUpperCase();
  const phone = $('aPhone').value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const fail = (m) => { e.textContent = m; e.style.display = 'block'; };
  if (!/^[A-Z0-9]{6,20}$/.test(prn)) return fail('सही PRN डालें (सिर्फ़ letters और numbers).');
  if (!/^[6-9]\d{9}$/.test(phone)) return fail('सही 10 अंकों का mobile number डालें।');
  const btn = $('aBtn'); const label = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  try {
    const res = await fetch('/api/event?action=lookup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prn, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration नहीं मिला।');
    showResult('success', data.order_id);   // same page that opens after a completed registration
  } catch (err) {
    fail(err.message || 'Something went wrong.');
    btn.disabled = false; btn.innerHTML = label;
  }
}

function renderTracks(list) {
  $('catCount').textContent = list.length;
  const hc = $('heroCats'); hc.innerHTML = '';
  list.forEach(t => { const s = document.createElement('span'); s.textContent = t.title; hc.appendChild(s); });
  const box = $('tracks'); box.innerHTML = '';
  list.forEach(t => {
    const l = document.createElement('label'); l.className = 'track';
    const i = document.createElement('input'); i.type = 'radio'; i.name = 'track'; i.value = t.id;
    const ic = document.createElement('i'); ic.className = 'fa-solid ' + t.icon;
    const b = document.createElement('b'); b.textContent = t.title;
    l.append(i, ic, b); box.appendChild(l);
  });
}

// Countdown + auto-close (server also rejects registrations after the deadline)
let resultShown = false, clockOffset = 0, closesAt = null;
function closeRegistration() {
  if (resultShown) return;
  $('formCard').style.display = 'none';
  $('closedCard').style.display = 'block';
}
function tick() {
  if (!closesAt) return;
  const left = closesAt - (Date.now() + clockOffset);
  if (left <= 0) { closeRegistration(); return; }
  const d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5), m = Math.floor(left % 36e5 / 6e4), sec = Math.floor(left % 6e4 / 1e3);
  $('timerVal').textContent = (d ? d + 'd ' : '') + String(h).padStart(2, '0') + 'h ' + String(m).padStart(2, '0') + 'm ' + String(sec).padStart(2, '0') + 's';
  $('timer').style.display = 'flex';
}
(async function () {
  try {
    const d = await (await fetch('/api/event?action=info')).json();
    closesAt = Date.parse(d.closes_at); clockOffset = Date.parse(d.now) - Date.now();
    renderTracks(d.tracks || []);
    if (!d.submit_open) $('subNote').style.display = 'block';
    if (d.topics_open) $('topicBtn').style.display = 'flex';
    tick(); setInterval(tick, 1000);
  } catch (e) { $('tracks').innerHTML = '<p class="hint">Categories load नहीं हो पाईं। Page refresh करें।</p>'; }
})();

// Result card (used after returning from the gateway AND by the "already registered" lookup)
function showResult(status, orderId) {
  const oid = String(orderId || '').replace(/[^A-Za-z0-9_-]/g, '');
  const ok = status === 'success', dup = status === 'duplicate';
  resultShown = true;
  $('formCard').style.display = 'none';
  $('closedCard').style.display = 'none';
  const r = $('resultCard'); r.style.display = 'block';
  r.innerHTML = '<div class="result ' + (ok ? 'ok' : 'bad') + '">' +
    '<i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') + '"></i>' +
    '<h2>' + (ok ? 'Registration हो गया!' : dup ? 'पहले से registered हैं' : 'Payment नहीं हो पाया') + '</h2>' +
    '<p>' + (ok ? 'आप <b>स्वयं</b> के लिए registered हैं। नीचे का Order ID संभालकर रखें (screenshot ले लें)। Topic चुनने और अपना काम submit करने के लिए आपको अपना PRN और यही Order ID चाहिए होगा।'
                : dup ? 'यह PRN पहले से registered है, इसलिए यह extra payment गिनी नहीं गई। Refund के लिए नीचे का Order ID लेकर हमसे संपर्क करें।'
                : 'आपका registration पूरा नहीं हुआ। अगर पैसे कट गए हैं तो वे अपने आप वापस आ जाएँगे। कृपया दोबारा try करें।') + '</p>' +
    (oid ? '<div class="oid">Order ID: ' + oid + '</div><br>' : '') +
    '<a class="link" href="' + (ok || dup ? '/' : '/event') + '">' + (ok || dup ? 'Home पर जाएँ' : 'दोबारा try करें') + '</a></div>';
}

// Result state after returning from the gateway (/api/event?action=verify redirects here)
(function () {
  const q = new URLSearchParams(location.search);
  const status = q.get('status');
  if (!status) return;
  showResult(status, q.get('order_id'));
  history.replaceState(null, '', '/event');
})();
