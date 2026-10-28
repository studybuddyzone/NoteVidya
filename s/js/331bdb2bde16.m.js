
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, updateDoc,
  setDoc as fsSetDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getDatabase, ref as rtdbRef, update as rtdbUpdate,
  set as rtdbSet, get as rtdbGet
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// आपका ओरिजिनल कॉन्फ़िगरेशन
const firebaseConfig = {
  apiKey: "AIzaSyCZhDPaVY7jv_hXtHdpVqUcGe1hwAxvZmc",
  authDomain: "students-e5183.firebaseapp.com",
  databaseURL: "https://students-e5183-default-rtdb.firebaseio.com",
  projectId: "students-e5183",
  storageBucket: "students-e5183.firebasestorage.app",
  messagingSenderId: "473442117683",
  appId: "1:473442117683:web:f39adc0665317aa95e9b46",
  measurementId: "G-DT4XQLZJW3"
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);   // Realtime DB — role update
const db = getFirestore(app);

let allRequests = [];
let currentFilter = 'all';

const TIER_LABELS = { silver:'🥈 Silver', gold:'🥇 Gold', diamond:'💎 Diamond' };
const TIER_CLASS  = { silver:'tb-silver', gold:'tb-gold', diamond:'tb-diamond' };

window.setFilter = function(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRequests();
};

window.loadRequests = async function() {
  document.getElementById('requestsGrid').innerHTML =
    `<div class="empty-state"><div class="empty-icon">⏳</div><div>Loading requests...</div></div>`;

  try {
    // सबसे पहले कस्टमाइज्ड ऑर्डर में डेटा लाने की कोशिश करें
    const q = query(collection(db, 'requests'), orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);
    allRequests = [];
    snap.forEach(docSnap => {
      allRequests.push({ key: docSnap.id, ...docSnap.data() });
    });
  } catch(e) {
    console.warn('Ordered query failed, falling back to unordered fetch:', e.message);
    try {
      // अगर Index नहीं बना है, तो बिना orderBy के सारा डेटा फेच करें ताकि स्क्रीन खाली न रहे
      const snap = await getDocs(collection(db, 'requests'));
      allRequests = [];
      snap.forEach(docSnap => {
        allRequests.push({ key: docSnap.id, ...docSnap.data() });
      });
      allRequests.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
    } catch(e2) {
      document.getElementById('requestsGrid').innerHTML =
        `<div class="empty-state"><div class="empty-icon">❌</div><div>Error loading database: ${e2.message}</div></div>`;
      return;
    }
  }

  // पुराने रिक्वेस्ट्स को बिना क्रैश किए सुरक्षित तरीके से ऑटो-रिजेक्ट करें
  const now = Date.now();
  for (const r of allRequests) {
    // Auto-reject pending requests after 24 hours
    if ((r.status === 'pending' || !r.status) && r.expiresAt && now > r.expiresAt) {
      try {
        await autoReject(r);
        r.status = 'rejected';
        r.rejectedReason = 'Auto-rejected: 24 hours expired';
      } catch(err) {
        console.error("Skipping faulty auto-reject for card:", r.key);
      }
    }
    // Auto-expire premium — if 6 months passed, reset role to 'student'
    if (r.status === 'approved' && r.premiumUntil && now > r.premiumUntil) {
      try {
        await autoExpirePremium(r);
      } catch(err) {
        console.error('Skipping faulty auto-expire for:', r.key);
      }
    }
  }

  updateStats();
  renderRequests();
};

// Auto-expire premium after 6 months → reset role to 'student'
async function autoExpirePremium(r) {
  try {
    const safeKey = r.safeKey || r.prn;
    const now = Date.now();

    // Mark request as expired
    await updateDoc(doc(db, 'requests', r.key), {
      status: 'expired',
      expiredAt: now,
    });

    // Update payments doc
    if (safeKey) {
      await updateDoc(doc(db, 'payments', safeKey), {
        status: 'expired',
        unlocked: false,
        expiredAt: now,
      });
    }

    // Reset RTDB role → 'student'
    if (safeKey) {
      try {
        await rtdbUpdate(rtdbRef(rtdb, `users/${safeKey}`), {
          role: 'student',
          premiumExpiredAt: now,
        });
      } catch(e) {
        console.warn('RTDB expire update failed:', e.message);
      }
    }

    // Reset Firestore users doc role
    if (safeKey) {
      try {
        await updateDoc(doc(db, 'users', safeKey), {
          role: 'student',
          premiumExpiredAt: now,
        });
      } catch(e) {
        console.warn('Firestore users expire update skipped:', e.message);
      }
    }

    console.log(`✅ Auto-expired premium for ${safeKey}`);
  } catch(e) {
    console.error('Auto-expire error:', e);
  }
}

async function autoReject(r) {
  try {
    await updateDoc(doc(db, 'requests', r.key), {
      status: 'rejected',
      rejectedReason: 'Auto-rejected after 24 hours',
      rejectedAt: Date.now()
    });
    const safeKey = r.safeKey || r.email || r.emailRaw;
    if (safeKey) {
      await updateDoc(doc(db, 'payments', safeKey), {
        status: 'rejected',
        rejectedAt: Date.now(),
      });
    }
  } catch(e) {
    console.error('Auto-reject background error:', e);
  }
}

function updateStats() {
  const pending  = allRequests.filter(r => r.status === 'pending' || !r.status).length;
  const expired  = allRequests.filter(r => r.status === 'expired').length;
  const approved = allRequests.filter(r => r.status === 'approved').length;
  const rejected = allRequests.filter(r => r.status === 'rejected').length;
  document.getElementById('statTotal').textContent   = allRequests.length;
  document.getElementById('statPending').textContent  = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;
}

function renderRequests() {
  const grid = document.getElementById('requestsGrid');
  
  // फ़िल्टर लॉजिक में सुरक्षा (मिसिंग स्टेटस को 'pending' मानेंगे)
  const filtered = currentFilter === 'all'
    ? allRequests
    : allRequests.filter(r => {
        const s = r.status || 'pending';
        return s === currentFilter;
      });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div>No ${currentFilter === 'all' ? '' : currentFilter} requests found</div></div>`;
    return;
  }

  grid.innerHTML = filtered.map(r => {
    const currentStatus = r.status || 'pending';
    const now = Date.now();
    const remaining = r.expiresAt ? (r.expiresAt - now) : 0;
    const hrs  = Math.max(0, Math.floor(remaining / 3600000));
    const mins = Math.max(0, Math.floor((remaining % 3600000) / 60000));
    const timerText = currentStatus === 'pending'
      ? (remaining > 0 ? `⏰ Auto-reject in ${hrs}h ${mins}m` : '⚠️ Expired — pending action')
      : '';
    const timerClass = hrs < 3 ? 'urgent' : '';

    const pct = Math.min(100, Math.round(((r.totalPaid || 0) / (r.requiredAmount || 1)) * 100));
    const isEnough   = !!r.isEnough;
    const amountClass = isEnough ? 'amount-enough' : 'amount-partial';
    const fillClass   = isEnough ? 'fill-full' : 'fill-partial';
    
    let date = "Unknown Date";
    if (r.submittedAt) {
      try { date = new Date(r.submittedAt).toLocaleString('en-IN'); } catch(e){}
    }
    
    const isPending = currentStatus === 'pending';
    const screenshotSrc = r.screenshotBase64 || r.screenshotUrl || '';
    const safeKeyToPass = r.safeKey || r.email || r.emailRaw || '';

    return `
    <div class="card ${currentStatus}" id="card-${r.key}">
      <div class="card-top">
        <div>
          <div class="user-name">${r.name || 'Anonymous User'}</div>
          <div class="user-sub">PRN: <strong>${r.prn || '—'}</strong></div>
          <div class="user-sub">✉️ ${r.email || r.emailRaw || 'No Email Provided'}</div>
        </div>
        <span class="status-pill pill-${currentStatus}">
          ${currentStatus === 'pending' ? '⏳ PENDING' : currentStatus === 'approved' ? '✅ APPROVED' : currentStatus === 'expired' ? '⌛ EXPIRED' : '❌ REJECTED'}
        </span>
      </div>

      <div class="tier-row">
        <span class="tier-badge ${TIER_CLASS[r.tier] || ''}">${TIER_LABELS[r.tier] || r.tier || 'Standard'}</span>
        <div class="amount-info">
          <div class="amount-main ${amountClass}">₹${r.totalPaid || 0} <span style="font-size:13px;color:var(--muted)">/ ₹${r.requiredAmount || 0}</span></div>
          <div class="amount-sub">${isEnough ? '✅ Full payment' : `⚠️ Partial — ₹${(r.requiredAmount || 0) - (r.totalPaid || 0)} remaining`}</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
      </div>

      ${isPending ? `<div class="timer ${timerClass}">${timerText}</div>` : ''}
      ${r.rejectedReason ? `<div style="font-size:11px;color:var(--red);margin-bottom:8px;">❌ Reason: ${r.rejectedReason}</div>` : ''}

      ${currentStatus === 'approved' && r.premiumSince && r.premiumUntil ? `
        <div style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:11px;line-height:1.8;">
          <div style="font-weight:700;color:var(--green);margin-bottom:4px;">📅 Premium Validity</div>
          <div style="color:var(--muted);">🟢 Activated: <strong style="color:var(--text);">${new Date(r.premiumSince).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong></div>
          <div style="color:var(--muted);">🔴 Expires: <strong style="color:var(--text);">${new Date(r.premiumUntil).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong></div>
          <div style="color:var(--muted);">${(() => { const d = Math.ceil((r.premiumUntil - Date.now())/(1000*60*60*24)); return d > 0 ? `⏳ <strong style="color:var(--green);">${d} day${d!==1?'s':''} remaining</strong>` : `⚠️ <strong style="color:var(--red);">Expired</strong>`; })()}</div>
        </div>
      ` : ''}

      <div style="font-size:11px;color:var(--muted);margin-bottom:10px;">📅 ${date} • Ref: ${r.key}</div>

      ${screenshotSrc
        ? `<img class="screenshot-thumb" src="${sbzUrl(screenshotSrc)}" alt="Payment Screenshot" onclick="openLightbox('${screenshotSrc.startsWith('data:') ? 'base64' : screenshotSrc}', ${screenshotSrc.startsWith('data:') ? JSON.stringify(screenshotSrc) : `'${screenshotSrc}'`})" loading="lazy" decoding="async"/>`
        : `<div style="background:var(--border);border-radius:8px;height:80px;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted);margin-bottom:12px;">No screenshot uploaded</div>`
      }

      ${isPending ? `
      <div class="action-row">
        <button class="btn-approve" onclick="handleApprove('${r.key}','${safeKeyToPass}','${r.tier || 'silver'}',${isEnough})">
          ✅ Approve
        </button>
        <button class="btn-reject" onclick="handleReject('${r.key}','${safeKeyToPass}')">
          ❌ Reject
        </button>
      </div>
      ` : ''}
    </div>`;
  }).join('');
}

window.handleApprove = async function(key, safeKey, tier, isEnough) {
  if (!safeKey) {
    const customKey = window.prompt("⚠️ safeKey/Email missing for this user. Enter user's Email to update payments node:");
    if (!customKey) return;
    safeKey = customKey;
  }
  if (!isEnough) {
    const ok = window.confirm('⚠️ Payment is PARTIAL (not full amount). Are you sure you want to approve anyway?');
    if (!ok) return;
  }

  const card = document.getElementById('card-' + key);
  card.querySelectorAll('button').forEach(b => b.disabled = true);

  try {
    const now = Date.now();
    const premiumSince = now;
    const premiumUntil = now + (180 * 24 * 60 * 60 * 1000); // 6 months (180 days)

    // 1. Firestore requests update
    await updateDoc(doc(db, 'requests', key), {
      status: 'approved',
      approvedAt: now,
      premiumSince,
      premiumUntil,
    });

    // 2. Firestore payments update
    await updateDoc(doc(db, 'payments', safeKey), {
      status: 'approved',
      unlocked: true,
      approvedAt: now,
      premiumSince,
      premiumUntil,
      [`tiers.${tier}`]: true,
    });

    // 3. Realtime DB
    const tierToRole = { silver: 'silver', gold: 'gold', diamond: 'diamond' };
    const newRole = tierToRole[tier] || tier;
    try {
      // 3a. users/{PRN} — role + premiumSince + premiumUntil merge karo
      //     existing data preserve karo (name, email, etc.)
      const snap = await rtdbGet(rtdbRef(rtdb, `users/${safeKey}`));
      const existing = snap.exists() ? snap.val() : {};
      await rtdbSet(rtdbRef(rtdb, `users/${safeKey}`), {
        ...existing,
        role: newRole,
        premiumSince,
        premiumUntil,
      });

      // 3b. premium/{PRN} — alag premium collection with full details
      await rtdbSet(rtdbRef(rtdb, `premium/${safeKey}`), {
        prn: safeKey,
        name: existing.name || '',
        email: existing.email || '',
        role: newRole,
        tier,
        premiumSince,
        premiumUntil,
        approvedAt: now,
        status: 'active',
      });

    } catch(rtdbErr) {
      console.warn('RTDB update failed:', rtdbErr.message);
      showToast(`⚠️ Approved but RTDB error: ${rtdbErr.message}`, 'error');
      setTimeout(loadRequests, 800);
      return;
    }

    // 4. Firestore users collection — setDoc with merge
    try {
      await fsSetDoc(doc(db, 'users', safeKey), {
        role: newRole,
        premiumSince,
        premiumUntil,
      }, { merge: true });
    } catch(fsErr) {
      console.warn('Firestore users doc skipped:', fsErr.message);
    }

    showToast(`✅ Approved! ${safeKey} — ${newRole.toUpperCase()} · Expires in 6 months`, 'success');
    setTimeout(loadRequests, 800);
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
    card.querySelectorAll('button').forEach(b => b.disabled = false);
  }
};

window.handleReject = async function(key, safeKey) {
  if (!safeKey) {
    const customKey = window.prompt("⚠️ safeKey/Email missing. Enter user's Email to update payments node:");
    if (!customKey) return;
    safeKey = customKey;
  }
  const reason = window.prompt('Rejection reason (optional):') ?? 'Rejected by admin';
  const card = document.getElementById('card-' + key);
  card.querySelectorAll('button').forEach(b => b.disabled = true);

  try {
    await updateDoc(doc(db, 'requests', key), {
      status: 'rejected',
      rejectedReason: reason,
      rejectedAt: Date.now()
    });
    await updateDoc(doc(db, 'payments', safeKey), {
      status: 'rejected',
      rejectedAt: Date.now(),
    });

    showToast(`❌ Rejected — ${safeKey}`, 'error');
    setTimeout(loadRequests, 800);
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
    card.querySelectorAll('button').forEach(b => b.disabled = false);
  }
};

window.openLightbox = function(type, src) {
  const imgSrc = type === 'base64' ? src : type;
  document.getElementById('lightboxImg').src = imgSrc;
  document.getElementById('lightbox').classList.add('open');
};
window.closeLightbox = function() {
  document.getElementById('lightbox').classList.remove('open');
};

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// Auto-refresh every 60 seconds
loadRequests();
setInterval(loadRequests, 60000);
