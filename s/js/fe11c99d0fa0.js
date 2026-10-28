
const SLUG = 'swayam-gtmc', FEE = 30;
const $ = (id) => document.getElementById(id);
function showErr(msg) { const e = $('err'); e.textContent = msg; e.style.display = 'block'; }
const PAY_LABEL = '<i class="fa-solid fa-lock"></i> Register & Pay ₹30';

async function startPayment() {
  $('err').style.display = 'none';
  const prn = $('prn').value.trim().toUpperCase();
  const name = $('name').value.trim();
  const phone = $('phone').value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const course = (document.querySelector('input[name=course]:checked') || {}).value || '';
  const year = $('year').value;
  const branch = $('branch').value.trim().replace(/\s+/g, ' ');
  if (!/^[A-Z0-9]{6,20}$/.test(prn)) return showErr('Enter a valid PRN (letters and numbers only).');
  if (name.length < 3) return showErr('Enter your full name.');
  if (!/^[6-9]\d{9}$/.test(phone)) return showErr('Enter a valid 10-digit mobile number.');
  if (!course) return showErr('Select Polytechnic or Engineering.');
  if (!year) return showErr('Select your year.');
  if (!/^[A-Za-z0-9][A-Za-z0-9 &.,()\/+-]{1,49}$/.test(branch)) return showErr('Enter a valid branch (2 to 50 characters; letters, numbers, and & . , ( ) - / + only).');
  const sel = document.querySelector('input[name=track]:checked');
  if (!sel) return showErr('Select your competition category.');

  const btn = $('payBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  try {
    const res = await fetch('/api/event?action=gtmc-register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prn, name, phone, course, year: Number(year), branch, track: sel.value })
    });
    const data = await res.json();
    if (res.status === 403) { closeRegistration(); return; }
    if (!res.ok) throw new Error(data.message || 'Could not start payment.');
    const cashfree = await Cashfree({ mode: 'production' });
    cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: '_self' });
  } catch (e) {
    showErr(e.message || 'Something went wrong.');
    btn.disabled = false; btn.innerHTML = PAY_LABEL;
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
  if (!/^[A-Z0-9]{6,20}$/.test(prn)) return fail('Enter a valid PRN (letters and numbers only).');
  if (!/^[6-9]\d{9}$/.test(phone)) return fail('Enter a valid 10-digit mobile number.');
  const btn = $('aBtn'); const label = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  try {
    const res = await fetch('/api/event?action=gtmc-lookup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prn, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration not found.');
    showResult('success', data.order_id);
  } catch (err) {
    fail(err.message || 'Something went wrong.');
    btn.disabled = false; btn.innerHTML = label;
  }
}

// ───── Certificate ─────
let certData = null;
function toggleCert() {
  const c = $('certCard'); const open = c.style.display !== 'block';
  c.style.display = open ? 'block' : 'none';
  if (open) { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('cPrn').focus(); }
}
async function getCertificate() {
  const e = $('cErr'); e.style.display = 'none';
  const prn = $('cPrn').value.trim().toUpperCase();
  const fail = (m) => { e.textContent = m; e.style.display = 'block'; };
  if (!/^[A-Z0-9]{6,20}$/.test(prn)) return fail('Enter a valid PRN / EN number (letters and numbers only).');
  const btn = $('cBtn'); const label = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  try {
    const res = await fetch('/api/event?action=gtmc-certificate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prn }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Certificate not available.');
    certData = data;
    $('cOk').textContent = '✔ ' + data.name + ' · Certificate ID: ' + data.certificate_id;
    await GtmcCert.render($('cPreview'), data, false);
    $('cOut').style.display = 'block';
  } catch (err) { fail(err.message || 'Something went wrong.'); }
  btn.disabled = false; btn.innerHTML = label;
}
async function downloadCert(kind) {
  if (!certData) return;
  const btn = event && event.currentTarget; const label = btn ? btn.innerHTML : '';
  try {
    if (kind === 'pdf') {
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing...'; }
      await GtmcCert.signedPdf('gtmc-certificate-pdf', { prn: certData.prn });
    } else { await GtmcCert.png(certData, false); }
  } catch (err) { alert(err.message || 'Download नहीं हुआ। दोबारा try करें।'); }
  if (btn) { btn.disabled = false; btn.innerHTML = label; }
}

// ───── Topic portal ─────
const SUBMISSION_URL = '/submission-GTMC';
const TP_COLORS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#e11d48'];
let tpPrn = '', tpTopics = {}, tpPicked = '', tpRedirectTimer = null;
function toggleTopic() {
  const c = $('topicCard'); const open = c.style.display !== 'block';
  c.style.display = open ? 'block' : 'none';
  if (open) { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); if ($('tpVerify').style.display !== 'none') $('tPrn').focus(); }
}
function tpFail(id, m) { const e = $(id); e.textContent = m; e.style.display = 'block'; }
function goSubmission(d) {
  // Already has a topic: show it and send the student to the submission portal.
  $('tpVerify').style.display = 'none'; $('tpPick').style.display = 'none';
  const box = $('tpDone'); box.style.display = 'block'; box.textContent = '';
  const ic = document.createElement('i'); ic.className = 'fa-solid fa-circle-check'; ic.style.cssText = 'font-size:40px;color:var(--green2)';
  const h = document.createElement('h2'); h.textContent = d.fresh ? 'Topic Assigned!' : 'Topic पहले ही assign हो चुका है';
  const p = document.createElement('p'); p.className = 'hint'; p.style.fontSize = '14px';
  const t = d.topic || {};
  p.append((d.name ? d.name + ' · ' : ''), Object.assign(document.createElement('b'), { textContent: t.title || '' }));
  const q = document.createElement('p'); q.className = 'hint'; q.textContent = (t.category ? t.category + '. ' : '') + (d.fresh ? 'Submission Portal का link नीचे है।' : 'अब आपको Submission Portal पर भेजा जा रहा है...');
  const a = document.createElement('a'); a.className = 'btn'; a.href = d.redirect || SUBMISSION_URL;
  a.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Go to Submission Portal';
  box.append(ic, h, p, q, a);
  clearTimeout(tpRedirectTimer);
  if (!d.fresh) tpRedirectTimer = setTimeout(() => { location.href = d.redirect || SUBMISSION_URL; }, 1500);
}
async function verifyTopicPrn() {
  $('tErr').style.display = 'none';
  const prn = $('tPrn').value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,20}$/.test(prn)) return tpFail('tErr', 'Enter a valid PRN (letters and numbers only).');
  const btn = $('tBtn'); const label = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  try {
    const res = await fetch('/api/event?action=gtmc-topic-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prn }) });
    const d = await res.json();
    if (!res.ok) throw new Error(d.message || 'PRN verify नहीं हुआ।');
    tpPrn = prn;
    if (d.assigned) return goSubmission(d);
    renderTopicList(d);
  } catch (err) { tpFail('tErr', err.message || 'Something went wrong.'); }
  btn.disabled = false; btn.innerHTML = label;
}
function renderTopicList(d) {
  tpTopics = {}; tpPicked = '';
  $('tpVerify').style.display = 'none'; $('tpPick').style.display = 'block';
  $('tpHello').textContent = '✔ PRN verified' + (d.name ? ' · ' + d.name : '');
  const root = $('tpCats'); root.textContent = '';
  (d.categories || []).forEach((c, ci) => {
    const cat = document.createElement('div'); cat.className = 'tp-cat'; cat.style.setProperty('--acc', TP_COLORS[ci % TP_COLORS.length]);
    const hid = 'tpH' + ci, pid = 'tpP' + ci;
    const head = document.createElement('button'); head.type = 'button'; head.className = 'tp-head'; head.id = hid;
    head.setAttribute('aria-expanded', 'false'); head.setAttribute('aria-controls', pid);
    const ic = document.createElement('span'); ic.className = 'tp-ic'; ic.innerHTML = '<i class="fa-solid ' + String(c.icon).replace(/[^a-z0-9-]/gi, '') + '" aria-hidden="true"></i>';
    const tx = document.createElement('span'); tx.className = 'tp-txt';
    const b = document.createElement('b'); b.textContent = c.title;
    const ds = document.createElement('span'); ds.textContent = c.desc;
    const ct = document.createElement('span'); ct.className = 'tp-count'; ct.textContent = c.topics.length + ' topics';
    tx.append(b, ds, ct);
    const ch = document.createElement('i'); ch.className = 'fa-solid fa-chevron-down tp-chev'; ch.setAttribute('aria-hidden', 'true');
    head.append(ic, tx, ch);
    const panel = document.createElement('div'); panel.className = 'tp-panel'; panel.id = pid; panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', hid);
    const inner = document.createElement('div'); inner.className = 'tp-inner';
    const list = document.createElement('div'); list.className = 'tp-list'; list.setAttribute('role', 'radiogroup'); list.setAttribute('aria-label', c.title);
    c.topics.forEach((t, ti) => {
      tpTopics[t.id] = { title: t.title, category: c.title };
      const l = document.createElement('label'); l.className = 'tp-item';
      const r = document.createElement('input'); r.type = 'radio'; r.name = 'tptopic'; r.value = t.id;
      r.addEventListener('change', () => pickTopic(t.id));
      const n = document.createElement('em'); n.textContent = String(ti + 1).padStart(2, '0');
      const tt = document.createElement('span'); tt.textContent = t.title;
      l.append(r, n, tt); list.appendChild(l);
    });
    inner.appendChild(list); panel.appendChild(inner);
    head.addEventListener('click', () => { const open = !cat.classList.contains('open'); cat.classList.toggle('open', open); head.setAttribute('aria-expanded', String(open)); });
    cat.append(head, panel); root.appendChild(cat);
  });
}
function pickTopic(id) {
  tpPicked = id; $('tErr2').style.display = 'none';
  const t = tpTopics[id];
  $('tpChosen').textContent = 'चुना हुआ topic: ' + t.title + ' (' + t.category + ')';
  $('tSubmit').disabled = false;
}
async function submitTopic() {
  $('tErr2').style.display = 'none';
  if (!tpPicked || !tpTopics[tpPicked]) return tpFail('tErr2', 'सूची में से एक topic चुनें।');
  if (!confirm('"' + tpTopics[tpPicked].title + '" को अपना topic बनाएँ?\n\nSubmit करने के बाद topic बदला नहीं जा सकेगा।')) return;
  const btn = $('tSubmit'); const label = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  try {
    const res = await fetch('/api/event?action=gtmc-topic-assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prn: tpPrn, topic: tpPicked }) });
    const d = await res.json();
    if (res.status === 409 && d.assigned) return goSubmission(d);   // someone (or another tab) already saved a topic for this PRN
    if (!res.ok) throw new Error(d.message || 'Topic save नहीं हुआ।');
    d.fresh = true; return goSubmission(d);
  } catch (err) { tpFail('tErr2', err.message || 'Something went wrong.'); }
  btn.disabled = false; btn.innerHTML = label;
}

function renderTracks(list) {
  const box = $('tracks'); box.innerHTML = '';
  list.forEach((t, idx) => {
    const l = document.createElement('label'); l.className = 'track';
    const i = document.createElement('input'); i.type = 'radio'; i.name = 'track'; i.value = t.id; if (list.length === 1 && idx === 0) i.checked = true;
    const ic = document.createElement('i'); ic.className = 'fa-solid ' + t.icon;
    const b = document.createElement('b'); b.textContent = t.title;
    const s = document.createElement('span'); s.textContent = t.desc;
    l.append(i, ic, b, s); box.appendChild(l);
  });
}

let COURSES = {};
function fillYears() {
  const c = (document.querySelector('input[name=course]:checked') || {}).value;
  const sel = $('year'); sel.innerHTML = '';
  const o0 = document.createElement('option'); o0.value = ''; o0.disabled = true; o0.selected = true;
  const yrs = c && COURSES[c] ? COURSES[c] : null;
  o0.textContent = yrs ? 'Select your year' : 'Select course first'; sel.appendChild(o0);
  (yrs || []).forEach((y) => { const o = document.createElement('option'); o.value = y.v; o.textContent = y.t; sel.appendChild(o); });
  sel.disabled = !yrs;
}
document.querySelectorAll('input[name=course]').forEach((r) => r.addEventListener('change', fillYears));
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
    const d = await (await fetch('/api/event?action=info&event=' + SLUG)).json();
    closesAt = Date.parse(d.closes_at); clockOffset = Date.parse(d.now) - Date.now();
    (d.courses || []).forEach((c) => { COURSES[c.id] = c.years; });
    renderTracks(d.tracks || []);
    fillYears();
    tick(); setInterval(tick, 1000);
  } catch (e) { $('tracks').innerHTML = '<p class="hint">Could not load categories. Please refresh the page.</p>'; }
})();

function showResult(status, orderId) {
  const oid = String(orderId || '').replace(/[^A-Za-z0-9_-]/g, '');
  const ok = status === 'success', dup = status === 'duplicate';
  resultShown = true;
  $('formCard').style.display = 'none';
  $('closedCard').style.display = 'none';
  const r = $('resultCard'); r.style.display = 'block';
  r.innerHTML = '<div class="result ' + (ok ? 'ok' : 'bad') + '">' +
    '<i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') + '"></i>' +
    '<h2>' + (ok ? 'Successfully Registered!' : dup ? 'Already Registered' : 'Payment Failed') + '</h2>' +
    '<p>' + (ok ? 'You are registered for <b>Swayam Directed by ASTRA (Web Designing)</b>. Please save the Order ID below (take a screenshot). All further updates will be shared on our channels.'
              : dup ? 'This PRN is already registered, so this extra payment was not counted. Contact us with the Order ID below for a refund.'
              : 'Your registration was not completed. If money was debited, it will be refunded automatically. Please try again.') + '</p>' +
    (oid ? '<div class="oid">Order ID: ' + oid + '</div><br>' : '') +
    '<a class="link" href="' + (ok || dup ? '/' : '/event-gtmc') + '">' + (ok || dup ? 'Go to Home' : 'Try Again') + '</a></div>';
}
(function () {
  const q = new URLSearchParams(location.search);
  const status = q.get('status');
  if (!status) return;
  showResult(status, q.get('order_id'));
  history.replaceState(null, '', '/event-gtmc');
})();
