
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
        import { getDatabase, ref, get, update as rtdbUpdate } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
        import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

        const app  = initializeApp(firebaseConfig);
        const rtdb = getDatabase(app);
        const rtdbRef = ref;  // alias
        const db   = getFirestore(app);

        // ── Fetch user data — RTDB users + RTDB premium merged ──
        async function fetchUserData(prn) {
            let userData    = null;
            let premiumData = null;

            // 1. RTDB users/{PRN} — login info + role
            try {
                const snap = await get(ref(rtdb, `users/${prn}`));
                if (snap.exists()) userData = snap.val();
            } catch(e) {}

            // 2. RTDB premium/{PRN} — premiumSince, premiumUntil
            try {
                const psnap = await get(ref(rtdb, `premium/${prn}`));
                if (psnap.exists()) premiumData = psnap.val();
            } catch(e) {}

            // 3. Firestore fallback — agar RTDB mein nahi mila
            if (!userData) {
                try {
                    const docSnap = await getDoc(doc(db, 'users', prn));
                    if (docSnap.exists()) userData = docSnap.data();
                } catch(e) {}
            }

            if (!userData) return null;

            // Merge: premiumData se premiumSince/premiumUntil override karo
            // (premium collection mein fresh data hota hai)
            return {
                ...userData,
                ...(premiumData ? {
                    premiumSince: premiumData.premiumSince,
                    premiumUntil: premiumData.premiumUntil,
                    tier:         premiumData.tier,
                } : {}),
            };
        }

        function formatDate(val) {
            if (!val) return '—';
            // Handle Firestore Timestamp, seconds number, or ISO string
            let d;
            if (val && typeof val === 'object' && val.seconds) d = new Date(val.seconds * 1000);
            else if (typeof val === 'number') d = new Date(val < 1e12 ? val * 1000 : val);
            else d = new Date(val);
            if (isNaN(d)) return String(val);
            return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
        }

        function calcProgress(start, end) {
            const now = Date.now();
            const s = start instanceof Date ? start.getTime() : (start && start.seconds ? start.seconds*1000 : new Date(start).getTime());
            const e = end   instanceof Date ? end.getTime()   : (end   && end.seconds   ? end.seconds*1000   : new Date(end).getTime());
            if (!s || !e || isNaN(s) || isNaN(e)) return { pct:100, days:0 };
            const total = e - s; const elapsed = now - s;
            const pct = Math.max(0, Math.min(100, (elapsed/total)*100));
            const daysLeft = Math.max(0, Math.ceil((e - now)/(1000*60*60*24)));
            return { pct, daysLeft };
        }

        function getRoleClass(role) {
            const map = { gold:'role-gold', diamond:'role-diamond', admin:'role-admin',
                          master:'role-master', superadmin:'role-superadmin', moderator:'role-moderator' };
            return map[role] || 'role-default';
        }

        function getRoleIcon(role) {
            const map = { gold:'fa-star', diamond:'fa-gem', admin:'fa-shield',
                          master:'fa-crown', superadmin:'fa-bolt', moderator:'fa-user-shield' };
            return map[role] || 'fa-circle-user';
        }

        async function init() {
            // Get PRN from sessionStorage (set by material-hub)
            let prn = sessionStorage.getItem('sbz_verified_prn');

            // Dev fallback: allow ?prn= in URL
            if (!prn) {
                const urlP = new URLSearchParams(location.search).get('prn');
                if (urlP) { prn = urlP.trim().toUpperCase(); sessionStorage.setItem('sbz_verified_prn', prn); }
            }

            if (!prn) {
                // No PRN → send back
                window.location.href = 'material-hub';
                return;
            }

            // Show PRN immediately
            document.getElementById('sidebarPRN').textContent = 'PRN: ' + prn;

            const data = await fetchUserData(prn);

            if (!data) {
                sessionStorage.removeItem("sbz_verified_prn");
                window.location.href = "/";
                return;
            }

            // Name
            const name = data.name || data.displayName || data.fullName || 'Student';
            document.getElementById('sidebarName').textContent = name;
            document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();

            // Role
            const role = (data.role || 'student').toLowerCase();

            // Validity
            const vFrom  = data.premiumSince || data.validFrom  || data.activatedOn || null;
            const vUntil = data.premiumUntil || data.validUntil || data.expiresOn   || null;

            // ── EXPIRY CHECK (Option 2) ──────────────────────────────
            const ALLOWED_ROLES = ['master','superadmin','moderator','diamond','admin','gold'];
            const now = Date.now();

            // Resolve vUntil to ms timestamp
            let expireMs = null;
            if (vUntil) {
                if (typeof vUntil === 'object' && vUntil.seconds) expireMs = vUntil.seconds * 1000;
                else if (typeof vUntil === 'number') expireMs = vUntil < 1e12 ? vUntil * 1000 : vUntil;
                else expireMs = new Date(vUntil).getTime();
            }

            const isPremiumRole = ALLOWED_ROLES.includes(role);
            const isExpired     = expireMs && now > expireMs;

            if (isPremiumRole && isExpired) {
                // validity (6 mahine) khatam ho gayi — role 'student' reset karo RTDB mein
                try {
                    // users/{PRN} — role reset
                    await rtdbUpdate(rtdbRef(rtdb, `users/${prn}`), {
                        role: 'student',
                        premiumExpiredAt: now,
                    });
                    // premium/{PRN} — status expired mark karo
                    await rtdbUpdate(rtdbRef(rtdb, `premium/${prn}`), {
                        status: 'expired',
                        expiredAt: now,
                    });
                } catch(e) {
                    console.warn('Expiry RTDB update failed:', e.message);
                }
                // Session clear
                sessionStorage.removeItem('sbz_verified_prn');
                // Expired popup dikhao phir redirect
                showExpiredPopup();
                return;
            }

            // Non-premium role bhi block karo (safety net)
            if (!isPremiumRole && role !== 'master' && role !== 'superadmin' && role !== 'moderator') {
                if (!ALLOWED_ROLES.includes(role)) {
                    sessionStorage.removeItem('sbz_verified_prn');
                    window.location.href = 'material-hub';
                    return;
                }
            }
            // ────────────────────────────────────────────────────────

            const badge = document.getElementById('sidebarRoleBadge');
            badge.className = 'profile-role-badge ' + getRoleClass(role);
            badge.innerHTML = `<i class="fa-solid ${getRoleIcon(role)}" style="font-size:10px;"></i> ${role.charAt(0).toUpperCase()+role.slice(1)}`;

            document.getElementById('validFrom').textContent  = formatDate(vFrom);
            document.getElementById('validUntil').textContent = formatDate(vUntil);

            if (vFrom && vUntil) {
                const { pct, daysLeft } = calcProgress(vFrom, vUntil);
                const remaining = 100 - pct;
                const barEl = document.getElementById('validityBar');
                barEl.style.width = remaining + '%';
                if (remaining < 20) barEl.style.background = 'linear-gradient(90deg,#dc2626,#f87171)';
                else if (remaining < 50) barEl.style.background = 'linear-gradient(90deg,#d97706,#fbbf24)';
                document.getElementById('validityDaysLeft').textContent =
                    daysLeft > 0 ? `✅ ${daysLeft} day${daysLeft!==1?'s':''} remaining` : '⚠️ Validity expired';
            } else {
                document.getElementById('validityDaysLeft').textContent = 'Validity info not available.';
                document.getElementById('validityBar').style.width = '100%';
            }
        }

        init();
    