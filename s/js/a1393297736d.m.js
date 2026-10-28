
// ── Second Year pricing + validity (same numbers as the "main" catalog in the plans table) ──
const SY_PLANS = {
  silver:  { icon:'🥈', name:'SILVER',  price:49,  c1:'#64748b', c2:'#94a3b8', features:['Handwritten Notes','Previous Year Questions','Solo MCQ Practice','Question Bank'] },
  gold:    { icon:'🥇', name:'GOLD',    price:89,  c1:'#b45309', c2:'#f59e0b', features:['Everything in Silver','Battle Arena','Competitive Zone','Exclusive Content'] },
  diamond: { icon:'💎', name:'DIAMOND', price:162, c1:'#0e7490', c2:'#06b6d4', features:['Everything in Gold','Full Platform Access','All Resources','Priority Support'] }
};
const SY_VALIDITY_DAYS = 180;   // 6 months — same as the plans table

// ── Second Year branches (new, proper names) ──
const SY_BRANCH_NAMES = {
  cs:'Computer Science & Engineering', aiml:'Artificial Intelligence & Machine Learning', entc:'Electronics & Telecommunication',
  civil:'Civil Engineering', electrical:'Electrical Engineering', mech:'Mechanical Engineering', mechanical:'Mechanical Engineering',
  chem:'Chemical Engineering', it:'Information Technology', petro:'Petrochemical Engineering', prod:'Production Engineering'
};
function branchLabel(b) {
  const k = String(b || '').trim().toLowerCase();
  return SY_BRANCH_NAMES[k] || (k ? k.toUpperCase() : '—');
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const yymmdd = (ts) => { if (!ts) return 'NA'; const d = new Date(ts); return String(d.getFullYear()).slice(2) + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0'); };
function shortCode(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h.toString(36).toUpperCase().padStart(7,'0').slice(-7); }

window.fetchReceipt = async function () {
  const prn = document.getElementById('searchPRN').value.trim();
  if (!/^\d{16}$/.test(prn)) { showError('❌ Valid 16-digit PRN डालें।'); return; }
  const btn = document.getElementById('fetchBtn');
  btn.disabled = true; btn.textContent = 'Fetching…'; hideError();
  try {
    const apiRes = await fetch('https://studybuddypro-psi.vercel.app/api/backend?action=verify-prn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prn, mode: 'receipt' })
    });
    const data = await apiRes.json();
    if (!data || !data.found) return fail('❌ PRN database में नहीं मिला। Check करके दोबारा try करें।');
    const role = String(data.role || '').toLowerCase();
    if (!SY_PLANS[role]) return fail('❌ इस PRN पर कोई payment record नहीं मिला।');
    if (data.catalog === 'fy') return fail('ℹ️ यह First Year का payment है — First Year receipt के लिए /receipt खोलें।');
    renderReceipt(prn, data, role);
    document.getElementById('searchWrap').style.display = 'none';
    document.getElementById('receiptWrap').style.display = 'block';
    btn.disabled = false; btn.textContent = 'Generate Receipt →';
  } catch (e) { fail('Connection error: ' + e.message); }
  function fail(msg) { showError(msg); btn.disabled = false; btn.textContent = 'Generate Receipt →'; }
};

function renderReceipt(prn, data, role) {
  const plan = SY_PLANS[role];
  const act = data.premiumSince || null, exp = data.roleExpires || null, now = Date.now();
  const isActive = exp ? exp > now : true;
  const totalDays = act && exp ? Math.max(1, Math.round((exp - act) / 86400000)) : SY_VALIDITY_DAYS;
  const months = Math.max(1, Math.round(totalDays / 30));
  const validityLabel = `${months} Months (${totalDays} days)`;
  const pct = act && exp ? Math.min(100, Math.max(0, Math.round(((now - act) / (exp - act)) * 100))) : 0;
  const daysLeft = exp ? Math.max(0, Math.ceil((exp - now) / 86400000)) : null;
  const amount = Number(data.amount) > 0 ? Number(data.amount) : plan.price;
  const receiptNo = 'SBP-SY-' + prn.slice(-6) + '-' + yymmdd(act);
  const vcode = shortCode(prn + '|' + (act || '') + '|' + role);
  const gen = new Date();
  const genStr = gen.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) + ', ' + gen.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  const statusTxt = isActive ? 'Active' : 'Expired';

  const r = document.getElementById('receipt');
  r.innerHTML = `
  <div class="rc" style="--tier1:${plan.c1};--tier2:${plan.c2};">
    <div class="rc-stripe"></div>
    <div class="rc-main">
      <div class="rc-paid">PAID</div>

      <div class="rc-head">
        <div class="brand">
          <div class="brand-logo">SB</div>
          <div><div class="brand-name">Study Buddy Pro</div><div class="brand-sub">Premium Academic Hub • Second Year</div></div>
        </div>
        <div class="rc-title"><b>PAYMENT RECEIPT</b><span>SECOND YEAR • SY</span></div>
      </div>

      <div class="two-col">
        <div class="box">
          <div class="box-h">Billed To</div>
          <div class="row"><span>Student</span><b>${esc(data.name || '—')}</b></div>
          <div class="row"><span>PRN</span><b>${esc(prn)}</b></div>
          <div class="row"><span>Branch</span><b>${esc(branchLabel(data.branch))}</b></div>
          <div class="row"><span>Year</span><b>Second Year (SY B.Tech)</b></div>
        </div>
        <div class="box">
          <div class="box-h">Receipt Details</div>
          <div class="row"><span>Receipt No.</span><b>${esc(receiptNo)}</b></div>
          <div class="row"><span>Generated</span><b>${esc(genStr)}</b></div>
          <div class="row"><span>Payment via</span><b>Cashfree (Online)</b></div>
          <div class="row"><span>Status</span><b style="color:${isActive ? '#16a34a' : '#dc2626'};">${isActive ? '● ' : '○ '}${statusTxt}</b></div>
        </div>
      </div>

      <table class="items">
        <thead><tr><th>Description</th><th>Validity</th><th>Amount</th></tr></thead>
        <tbody><tr>
          <td><div class="it-name">${plan.icon} Study Buddy Pro Membership<span class="tier-chip">${plan.name}</span></div>
              <div class="it-sub">Second Year (SY) • ${esc(branchLabel(data.branch))}</div></td>
          <td>${esc(validityLabel)}</td>
          <td><b>₹${amount}</b></td>
        </tr></tbody>
      </table>
      <div class="total"><div class="total-box"><small>Total Paid</small><b>₹${amount}</b></div></div>

      <div class="validity">
        <div class="v-row">
          <div><small>Activation Date</small><b>${fmtDate(act)}</b></div>
          <div><small>Total Validity</small><b>${esc(validityLabel)}</b></div>
          <div style="text-align:right;"><small>Expiry Date</small><b style="${isActive ? '' : 'color:#dc2626;'}">${fmtDate(exp)}</b></div>
        </div>
        <div class="bar"><i style="width:${pct}%;"></i></div>
        <div class="v-foot"><span>${isActive ? 'Membership running' : 'Membership ended'}</span><b>${daysLeft !== null ? (isActive ? daysLeft + ' days left' : 'Expired') : ''}</b></div>
      </div>

      <div class="feats">${plan.features.map((f) => `<span class="feat">${esc(f)}</span>`).join('')}</div>

      <div class="note">
        यह <b>Study Buddy Pro</b> द्वारा जारी की गई official, computer-generated payment receipt है और signature के बिना valid है।
        Support के लिए अपने PRN के साथ WhatsApp करें: <b>+91 90493 21230</b>.
      </div>

      <div class="rc-foot">
        <div><b>Study Buddy Pro</b><br/>Premium Academic Hub — Official Document</div>
        <div class="vcode">Verification Code<br/><code>${vcode}</code></div>
      </div>
    </div>
  </div>`;
}

window.goBack = function () {
  document.getElementById('receiptWrap').style.display = 'none';
  document.getElementById('searchWrap').style.display = 'block';
};
function showError(msg) { const e = document.getElementById('errorBox'); e.textContent = msg; e.style.display = 'block'; }
function hideError() { document.getElementById('errorBox').style.display = 'none'; }
