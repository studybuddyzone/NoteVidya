
let selectedTier  = null;
let selectedPrice = 0;
let verifiedPRN   = null;
let studentData   = {};

// ── Step helpers ──────────────────────────────────────────────────
window.showStep = function(n) {
  document.querySelectorAll('.step').forEach((s, i) =>
    s.classList.toggle('active', i + 1 === n));
  document.querySelectorAll('.fy-step').forEach((e, i) => {
    e.classList.toggle('active', i + 1 === n);
    e.classList.toggle('done', i + 1 < n);
  });
};

// ── Step 1: Tier ──────────────────────────────────────────────────
window.selectTier = function(tier, price) {
  selectedTier = tier; selectedPrice = price;
  document.querySelectorAll('.tier').forEach(t =>
    t.className = 'tier');
  document.getElementById('tier-' + tier).classList.add('selected-' + tier);
  document.getElementById('proceedBtn').disabled = false;
};

const origShowStep = window.showStep;
window.showStep = function(n) {
  if (n === 2) resetPRNState();
  origShowStep(n);
};

function resetPRNState() {
  const inp = document.getElementById('prnInput');
  if (inp) { inp.value = ''; inp.className = 'prn-inp'; }
  setCounter(0);
  hideVerifyMsg();
  document.getElementById('debugBox').style.display = 'none';
  const btn = document.getElementById('verifyBtn');
  btn.className = 'main-btn';
  btn.disabled = true;
  btn.textContent = 'Verify PRN';
  btn.onclick = window.verifyPRN;
  verifiedPRN = null; studentData = {};
}

// ── Step 2: PRN typing ────────────────────────────────────────────
window.onPRNType = function(inp) {
  inp.value = inp.value.replace(/\D/g, '').slice(0, 16);
  const len = inp.value.length;
  setCounter(len);
  inp.className = 'prn-inp' + (len === 16 ? ' valid' : len > 0 ? ' invalid' : '');
  const btn = document.getElementById('verifyBtn');
  btn.className = 'main-btn';
  btn.disabled = len !== 16;
  btn.textContent = 'Verify PRN';
  btn.onclick = window.verifyPRN;
  hideVerifyMsg();
  verifiedPRN = null; studentData = {};
};

function setCounter(len) {
  const el = document.getElementById('prnCounter');
  el.textContent = `${len} / 16`;
  el.className = 'prn-counter' + (len === 16 ? ' ok' : len > 0 ? ' err' : '');
}

// ── Step 2: Verify PRN ────────────────────────────────────────────
window.verifyPRN = async function() {
  const prn = document.getElementById('prnInput').value.trim();
  if (!/^\d{16}$/.test(prn)) return;

  const btn = document.getElementById('verifyBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-w"></span> Verifying...';
  showVerifyMsg('checking', '<span class="spinner"></span> Checking in database...');

  try {
    // Payment is bound to the logged-in account; the typed PRN must match it.
    const profile = await SBZAuth.getMyProfile();
    const resetBtn = () => { btn.className = 'main-btn'; btn.textContent = 'Verify PRN'; btn.disabled = false; btn.onclick = window.verifyPRN; };
    if (!profile) {
      document.getElementById('debugBox').style.display = 'none';
      showVerifyMsg('err', '🔒 Pehle login karein, phir payment karein. Redirecting…');
      resetBtn();
      setTimeout(() => { window.location.href = '/?next=payment'; }, 1500);
      return;
    }
    if (profile.prn !== prn) {
      document.getElementById('debugBox').style.display = 'none';
      verifiedPRN = null; studentData = {};
      showVerifyMsg('err', '❌ Yeh PRN aapke login kiye hue account se match nahi karta.');
      resetBtn();
      return;
    }
    const result = { found: true, role: profile.role, name: profile.full_name, branch: profile.branch, uid: profile.id };

    document.getElementById('debugBox').style.display = 'none';

    if (result && result.found) {
      const userRole = (result.role || '').toLowerCase();
      if (['master', 'superadmin', 'admin', 'moderator'].includes(userRole)) {
        verifiedPRN = null; studentData = {};
        showVerifyMsg('err', '🚫 <strong>Access Restricted:</strong> Master user ko payment ki zarurat nahi hai.');
        btn.textContent = 'Restricted ❌';
        btn.classList.add('btn-restricted');
        btn.disabled = true;
        btn.onclick = null;
        return;
      }

      verifiedPRN = prn;
      studentData = { prn: prn, name: result.name, role: result.role, branch: result.branch, uid: result.uid };

      const name = studentData.name || '';
      showVerifyMsg('ok', `✅ PRN Verified! ${name ? 'Welcome, ' + name + '!' : 'Tap below to proceed.'}`);
      btn.className = 'main-btn';
      btn.textContent = 'Continue to Payment →';
      btn.disabled = false;
      btn.onclick = goToPayStep;
    } else {
      verifiedPRN = null; studentData = {};
      showVerifyMsg('err', '❌ PRN not found. Please check and re-enter.');
      btn.className = 'main-btn';
      btn.textContent = 'Verify PRN';
      btn.disabled = false;
      btn.onclick = window.verifyPRN;
    }

  } catch (err) {
    verifiedPRN = null; studentData = {};
    showVerifyMsg('err', '⚠️ Connection error. Please retry.');
    btn.className = 'main-btn';
    btn.textContent = 'Retry →';
    btn.disabled = false;
    btn.onclick = window.verifyPRN;
  }
};

function showVerifyMsg(type, html) {
  const el = document.getElementById('verifyMsg');
  el.className = 'verify-msg ' + type;
  el.innerHTML = html;
  el.style.display = 'flex';
}
function hideVerifyMsg() {
  document.getElementById('verifyMsg').style.display = 'none';
}

// ── Step 3: Summary ───────────────────────────────────────────────
function goToPayStep() {
  if (!verifiedPRN) return;
  const labels = { silver:'🥈 Silver', gold:'🥇 Gold', diamond:'💎 Diamond' };
  const name = studentData.name || studentData.Name || studentData.studentName || '—';
  document.getElementById('sumTier').textContent   = labels[selectedTier];
  document.getElementById('sumPRN').textContent    = verifiedPRN;
  document.getElementById('sumName').textContent   = name;
  document.getElementById('sumAmount').textContent = '₹' + selectedPrice;
  window.showStep(3);
}
window.goToPayStep = goToPayStep;

// ── Cashfree Payment ──────────────────────────────────────────────
window.initiateCashfreePayment = async function() {
  const btn = document.getElementById('payNowBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-w"></span> Creating Order...';

  try {
    const sess = await window.sbz.auth.getSession();
    const token = sess.data && sess.data.session && sess.data.session.access_token;
    if (!token) { window.location.href = '/?next=payment'; return; }
    // Only the plan is sent: identity comes from the token, price from the database.
    const res = await fetch('https://studybuddypro-psi.vercel.app/api/create-order-fy1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ role: selectedTier })
    });

    const data = await res.json();
    if (!data.payment_session_id) throw new Error(data.message || 'Order creation failed');

    const cashfree = await Cashfree ({ mode: 'production' });
    cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: '_self' });

  } catch (err) {
    alert('Payment error: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = 'Pay securely';
  }
};

// ── Particles ──────────────────────────────────────────────────────
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');
let W, H, dots = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);
for (let i = 0; i < 50; i++) {
  dots.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.4 + 0.3,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    a: Math.random() * 0.4 + 0.08
  });
}
(function animate() {
  ctx.clearRect(0, 0, W, H);
  dots.forEach(d => {
    d.x += d.vx; d.y += d.vy;
    if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
    if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99,102,241,${d.a})`;
    ctx.fill();
  });
  requestAnimationFrame(animate);
})();
