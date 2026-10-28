
const rtdb = SBZLegacy.database();
const dbRef = (d, path) => d.ref(path);
const dbGet = (r) => r.once('value');

// ── 12 Unique premium header gradients ──────────────────────────
const HEADER_GRADIENTS = [
  'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#2563eb 100%)',   // indigo-violet-blue
  'linear-gradient(135deg,#0f766e 0%,#0891b2 50%,#0284c7 100%)',   // teal-cyan-blue
  'linear-gradient(135deg,#7e22ce 0%,#a855f7 50%,#ec4899 100%)',   // purple-pink
  'linear-gradient(135deg,#1e40af 0%,#3730a3 50%,#6d28d9 100%)',   // deep-blue-indigo
  'linear-gradient(135deg,#065f46 0%,#047857 50%,#0891b2 100%)',   // emerald-teal
  'linear-gradient(135deg,#9d174d 0%,#be185d 50%,#7c3aed 100%)',   // rose-violet
  'linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%)',   // amber-gold
  'linear-gradient(135deg,#1e3a5f 0%,#1e40af 50%,#0891b2 100%)',   // navy-blue-cyan
  'linear-gradient(135deg,#134e4a 0%,#0f766e 50%,#7c3aed 100%)',   // teal-purple
  'linear-gradient(135deg,#4a1d96 0%,#6d28d9 50%,#0891b2 100%)',   // deep-violet-cyan
  'linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#1e40af 100%)',   // red-blue
  'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)',   // deep-green
];

const TIER_INFO = {
  silver:  { icon:'🥈', name:'SILVER TIER',        color:'t-silver', price:39,  features:['Handwritten Notes','Previous Year Questions (PYQs)','Solo MCQ Practice','Question Bank Access'] },
  gold:    { icon:'🥇', name:'GOLD TIER',           color:'t-gold',   price:69,  features:['All Silver features','Battle Arena Access','Competitive Zone','Exclusive Content'] },
  diamond: { icon:'💎', name:'DIAMOND ALL-ACCESS',  color:'t-diamond',price:129, features:['All Gold features','Full Platform Access','All Layout Resources','Priority Support','Lifetime Updates'] }
};

// ── Format timestamp → readable date ──────────────────────────
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
}

// ── Calculate days between two timestamps ────────────────────
function daysBetween(from, to) {
  if (!from || !to) return '—';
  const d = Math.round((to - from) / (1000 * 60 * 60 * 24));
  return d > 0 ? d + ' days' : 'Expired';
}

// ── Pick a random gradient each load ─────────────────────────
function randomGradient() {
  return HEADER_GRADIENTS[Math.floor(Math.random() * HEADER_GRADIENTS.length)];
}

window.fetchReceipt = async function() {
  const prn = document.getElementById('searchPRN').value.trim();

  if (!/^\d{16}$/.test(prn)) {
    showError('❌ Please enter a valid 16-digit PRN number.');
    return;
  }

  const btn = document.getElementById('fetchBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Fetching...';
  hideError();

  try {
    // Sidha RTDB read ki jagah ab secure server API se PRN verify hota hai
    const apiRes = await fetch('https://studybuddypro-psi.vercel.app/api/backend?action=verify-prn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prn, mode: 'receipt' })
    });
    const data = await apiRes.json();

    if (!data || !data.found) {
      showError('❌ PRN not found in database. Please check and try again.');
      btn.disabled = false; btn.innerHTML = 'Generate Receipt →';
      return;
    }

    const role = (data.role || '').toLowerCase();
    const allowedRoles = ['silver','gold','diamond'];

    if (!allowedRoles.includes(role)) {
      showError('❌ No payment record found. Please check your PRN and try again.');
      btn.disabled = false; btn.innerHTML = 'Generate Receipt →';
      return;
    }

    renderReceipt(prn, data);
    document.getElementById('searchWrap').style.display  = 'none';
    document.getElementById('receiptWrap').style.display = 'block';

  } catch(e) {
    showError('Connection error: ' + e.message);
    btn.disabled = false; btn.innerHTML = 'Generate Receipt →';
  }
};

function renderReceipt(prn, data) {
  const role     = (data.role || data.Role || 'silver').toLowerCase();
  const tierKey  = ['silver','gold','diamond'].includes(role) ? role : 'silver';
  const info     = TIER_INFO[tierKey];

  const name     = data.name || data.Name || data.studentName || '—';
  const branch   = data.branch || data.Branch || '—';
  const year     = data.year || data.Year || '—';

  const activatedTs  = data.premiumSince || data.activatedAt || data.createdAt || null;
  const expiryTs     = data.roleExpires || data.premiumUntil || data.expiresAt || null;
  const activatedStr = fmtDate(activatedTs);
  const expiryStr    = fmtDate(expiryTs);
  const validityStr  = '6 Months';

  const now        = Date.now();
  const isActive   = expiryTs ? expiryTs > now : true;
  const statusTxt  = isActive ? 'Active & Valid' : 'Expired';
  const statusColor= isActive ? '#16a34a' : '#dc2626';

  const receiptNo  = 'SZ-' + prn.slice(-6) + '-' + Date.now().toString().slice(-4);
  const genDate    = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const genTime    = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const headerGrad = randomGradient();
  const amount     = data.amount || data.totalPaid || info.price;

  document.getElementById('receipt').className = `receipt ${info.color}`;
  document.getElementById('receipt').innerHTML = `
    <div class="receipt-header" style="background:${headerGrad};">
      <div class="rh-top">
        <div>
          <div class="brand-name">Study Buddy Pro</div>
          <div class="brand-sub">Premium Academic Hub</div>
        </div>
        <div class="receipt-badge">OFFICIAL RECEIPT</div>
      </div>
      <hr class="rh-divider"/>
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-num">Receipt No: ${receiptNo} &nbsp;|&nbsp; Generated: ${genDate} at ${genTime}</div>
    </div>

    <div class="receipt-body">
      <div class="watermark">PAID</div>

      <div class="info-grid">
        <div>
          <div class="info-label">Student Name</div>
          <div class="info-value">${name}</div>
        </div>
        <div>
          <div class="info-label">PRN Number</div>
          <div class="info-value hl">${prn}</div>
        </div>
        <div>
          <div class="info-label">Branch</div>
          <div class="info-value">${branch}</div>
        </div>
        <div>
          <div class="info-label">Year</div>
          <div class="info-value">${year}</div>
        </div>
        <div>
          <div class="info-label">Membership Status</div>
          <div class="info-value" style="color:${statusColor};font-weight:700;">${isActive ? '✅ ' : '❌ '}${statusTxt}</div>
        </div>
        <div>
          <div class="info-label">Receipt Date</div>
          <div class="info-value">${genDate}</div>
        </div>
      </div>

      <!-- Validity Card -->
      <div class="validity-card">
        <div class="validity-title">🗓️ Membership Validity Details</div>
        <div class="validity-grid">
          <div class="v-block">
            <div class="v-label">Activation Date</div>
            <div class="v-value">${activatedStr}</div>
          </div>
          <div class="v-block">
            <div class="v-label">Expiry Date</div>
            <div class="v-value" style="${!isActive ? 'color:#dc2626;' : ''}">${expiryStr}</div>
          </div>
          <div class="v-block">
            <div class="v-label">Total Validity</div>
            <div class="v-days">${validityStr}</div>
          </div>
        </div>
      </div>

      <!-- Tier -->
      <div class="tier-section">
        <div class="tier-icon-big">${info.icon}</div>
        <div>
          <div class="tier-name-big">${info.name}</div>
          <div class="tier-desc-sm">Study Buddy Pro Premium Membership</div>
        </div>
        <div class="tier-amount">₹${amount}</div>
      </div>

      <!-- Status -->
      <div class="status-section">
        <div style="font-size:26px;">${isActive ? '✅' : '⚠️'}</div>
        <div>
          <div class="status-text-main" style="color:${statusColor};">Payment Verified &amp; ${statusTxt}</div>
          <div class="status-text-sub">Your ${info.name} membership is on record.</div>
        </div>
      </div>

      <!-- Amount -->
      <div class="amount-row">
        <div>
          <div class="amount-label">Amount Paid</div>
          <div class="amount-value">₹${amount}</div>
          <div class="amount-via">via Cashfree Online Payment</div>
        </div>
        <div class="qr-box">
          <div style="font-size:26px;">🔐</div>
          <div>Verified</div>
        </div>
      </div>

      <!-- Notice -->
      <div class="notice-box">
        <div class="notice-title">📋 Important Notice</div>
        <div class="notice-text">
          This is an <strong>official payment receipt</strong> issued by <strong>Study Buddy Pro Premium Academic Hub</strong>.
          This document confirms your premium membership is active and on record.<br/>
          Receipt No. <strong>${receiptNo}</strong> is unique to this transaction. Keep this for your records.<br/>
          For support, contact us with your PRN number via WhatsApp: <strong>+91 90493 21230</strong>
        </div>
      </div>
    </div>

    <div class="receipt-footer">
      <div>
        <div class="footer-brand">Study Buddy Pro</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">Premium Academic Hub — Official Document</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:1px;">Computer-generated receipt. Valid without signature.</div>
      </div>
      <div class="footer-note">
        Generated: ${genDate}<br/>
        Receipt No: ${receiptNo}<br/>
        <span style="color:#6366f1;font-weight:700;">✔ Verified &amp; Authenticated</span>
      </div>
    </div>
  `;
}

window.goBack = function() {
  document.getElementById('receiptWrap').style.display = 'none';
  document.getElementById('searchWrap').style.display  = 'block';
  document.getElementById('fetchBtn').disabled = false;
  document.getElementById('fetchBtn').innerHTML = 'Generate Receipt →';
};

function showError(msg) {
  const e = document.getElementById('errorBox');
  e.textContent = msg; e.style.display = 'block';
}
function hideError() {
  document.getElementById('errorBox').style.display = 'none';
}
