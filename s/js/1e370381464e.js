
  const BACKEND = 'https://studybuddypro-psi.vercel.app/api/backend';
const auth = SBZLegacy.auth();

  try { const t = localStorage.getItem('theme') || localStorage.getItem('sbz_theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) {}

  const YEAR_PAGES = { '1': 'fy', '2': 'second-year', '3': 'third-year', '4': 'fourth-year' };
  function goBack() {
    if (document.referrer && document.referrer.indexOf(location.origin) === 0 && history.length > 1) { history.back(); return; }
    location.href = YEAR_PAGES[state.year] || '/';
  }

  let state = { year: '', code: '', minWithdraw: 50, balance: 0 };
  let qrDataUrl = '';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inr = (n) => '₹' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-IN');
  const fmtDate = (t) => t ? new Date(t).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '';

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function api(action, extra) {
    const user = auth.currentUser;
    if (!user) throw new Error('Login नहीं है।');
    const idToken = await user.getIdToken();
    const res = await fetch(BACKEND + '?action=' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ idToken }, extra || {}))
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Server error');
    return data;
  }

  async function load() {
    try {
      const d = await api('refer-dashboard');
      const ok = !!d.eligible && !!d.code;
      document.getElementById('lockedCard').style.display = ok ? 'none' : 'block';
      document.getElementById('codeCard').style.display = ok ? 'block' : 'none';
      state.year = d.year || ''; state.code = d.code || ''; state.minWithdraw = d.minWithdraw; state.balance = d.wallet.balance;
      document.getElementById('myCode').textContent = d.code || '—';
      document.getElementById('pct').textContent = d.percent;
      document.getElementById('stRef').textContent = d.referredCount;
      document.getElementById('stSub').textContent = d.wallet.subscriptionCount;
      document.getElementById('stBal').textContent = inr(d.wallet.balance);
      document.getElementById('stEarn').textContent = inr(d.wallet.totalEarned);
      document.getElementById('minNote').textContent = 'Minimum withdrawal ' + inr(d.minWithdraw) + ' • Available: ' + inr(d.wallet.balance);

      document.getElementById('refList').innerHTML = d.referred.length ? d.referred.map((r) =>
        '<div class="row"><div><b>' + esc(r.name) + '</b><div class="sub">' + esc(r.prnMasked) + ' • ' + fmtDate(r.joinedAt) + '</div></div>' +
        '<div style="text-align:right;">' + (r.subscribed
          ? '<span class="pill yes">Subscribed</span><div class="sub" style="margin-top:3px;">+' + inr(r.commission) + '</div>'
          : '<span class="pill no">Not yet</span>') + '</div></div>'
      ).join('') : '<div class="empty">अभी कोई referral नहीं। अपना code शेयर करें!</div>';

      document.getElementById('wdList').innerHTML = d.withdrawals.length ? d.withdrawals.map((w) =>
        '<div class="row"><div><b>' + inr(w.amount) + '</b><div class="sub">' + fmtDate(w.createdAt) + (w.note ? ' • ' + esc(w.note) : '') + '</div></div>' +
        '<span class="pill ' + esc(w.status) + '">' + esc(w.status).toUpperCase() + '</span></div>'
      ).join('') : '<div class="empty">अभी कोई withdrawal नहीं।</div>';

      document.getElementById('loading').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
    } catch (err) {
      document.getElementById('loading').innerHTML = '<span style="color:#ef4444;">' + esc(err.message) + '</span><br><br><a href="/" style="color:var(--primary);font-weight:700;">Login पर जाएँ</a>';
    }
  }

  function refLink() {
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    return base + '/?ref=' + encodeURIComponent(state.code);
  }
  function copyCode() {
    (navigator.clipboard ? navigator.clipboard.writeText(state.code) : Promise.reject())
      .then(() => toast('Code copy हो गया ✔')).catch(() => toast('Code: ' + state.code));
  }
  function shareLink() {
    const text = 'StudyBuddyZone पर मेरे Refer code ' + state.code + ' से Sign Up करो: ' + refLink();
    if (navigator.share) navigator.share({ title: 'StudyBuddyZone', text }).catch(() => {});
    else (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Link copy हो गया ✔')).catch(() => toast(text));
  }

  // QR image ko max 900px JPEG me chhota karke rakhte hain (upload fast + chhota)
  function onQrPicked(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('सिर्फ image चुनें'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900, scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        qrDataUrl = c.toDataURL('image/jpeg', 0.85);
        const p = document.getElementById('qrPreview');
        p.src = qrDataUrl; p.style.display = 'block';
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function submitWithdraw() {
    const msg = document.getElementById('wMsg');
    const btn = document.getElementById('wBtn');
    const amount = Number(document.getElementById('wAmount').value);
    msg.style.color = '#ef4444';
    if (!amount || amount <= 0) { msg.textContent = 'Amount डालें।'; return; }
    if (amount < state.minWithdraw) { msg.textContent = 'Minimum withdrawal ' + inr(state.minWithdraw) + ' है।'; return; }
    if (amount > state.balance) { msg.textContent = 'Wallet में इतना balance नहीं है।'; return; }
    if (!qrDataUrl) { msg.textContent = 'Payment QR code upload करें।'; return; }

    btn.disabled = true; msg.style.color = 'var(--muted)'; msg.textContent = 'भेज रहे हैं...';
    try {
      await api('refer-withdraw', { amount, image: qrDataUrl });
      msg.style.color = '#10b981'; msg.textContent = '✔ Request भेज दी गई। Master approve करके payment भेज देगा।';
      document.getElementById('wAmount').value = ''; qrDataUrl = '';
      document.getElementById('qrPreview').style.display = 'none';
      await load();
    } catch (err) {
      msg.style.color = '#ef4444'; msg.textContent = err.message;
    }
    btn.disabled = false;
  }

  auth.onAuthStateChanged((user) => {
    if (!user) { window.location.href = '/'; return; }
    load();
  });
