
    // ── Allowed roles for main content ──
    const ALLOWED_ROLES   = ['gold','diamond','master','superadmin','admin','moderator'];
    const MOD_ROLES       = ['admin','superadmin','master','moderator'];
    const PREMIUM_ROLES   = ['gold','diamond','silver'];

    let currentUserRole = 'guest';
    let currentUserPRN  = null;

    // ── Sidebar ──
    function openSidebar()  { document.getElementById('mySidebar').classList.add('active'); document.getElementById('sidebarOverlay').classList.add('active'); }
    function closeSidebar() { document.getElementById('mySidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); }

    // ── Premium gate ──
    function showPremiumGate(role) {
        document.getElementById('gateRoleTag').innerText = 'Your role: ' + role.toUpperCase();
        document.getElementById('premiumGate').classList.add('active');
    }

    // ── Expired modal ──
    function closeExpiredModal() {
        document.getElementById('expiredModal').classList.remove('active');
        // After dismissing, re-evaluate gate
        checkAccessGate(currentUserRole);
    }

    // ── Mod locked popup ──
    function closeModLockedModal() { document.getElementById('modLockedModal').classList.remove('active'); }
    function handleModCard() {
        if (MOD_ROLES.includes(currentUserRole)) {
            // Unlock: open moderator notes (placeholder – update link when ready)
            openSubjectPdfList('Chemistry', 'notes-mod', 'Chemistry Notes (Moderator)');
        } else {
            document.getElementById('modLockedModal').classList.add('active');
        }
    }

    // ── Mod card UI update ──
    function updateModCardUI(role) {
        const card      = document.getElementById('modCard');
        const lockBadge = document.getElementById('modLockBadge');
        const arrowIcon = document.getElementById('modArrowIcon');
        const sub       = document.getElementById('modCardSub');
        if (MOD_ROLES.includes(role)) {
            card.classList.add('unlocked');
            lockBadge.style.display = 'none';
            arrowIcon.className = 'fa-solid fa-chevron-right';
            sub.innerText = 'Tap to open Moderator Notes';
        } else {
            card.classList.remove('unlocked');
            lockBadge.style.display = '';
            arrowIcon.className = 'fa-solid fa-lock';
            sub.innerText = 'Only Moderators & above can access this section';
        }
    }

    // ── Access gate ──
    function checkAccessGate(role) {
        if (!ALLOWED_ROLES.includes(role)) {
            showPremiumGate(role);
        }
    }

    // ── Role badge colour ──
    function applyMenuRoleStyle(role) {
        const badge = document.getElementById('menuUserRole');
        const colours = {
            master:['#000000','#f59e0b'], superadmin:['#e11d48','#ffffff'], admin:['#a855f7','#ffffff'],
            moderator:['#06b6d4','#ffffff'], diamond:['#ec4899','#ffffff'], gold:['#4f46e5','#ffffff'],
            silver:['#f59e0b','#ffffff'],   student:['#64748b','#ffffff'],  guest:['#64748b','#ffffff']
        };
        const c = colours[role] || colours.student;
        badge.style.background = c[0]; badge.style.color = c[1];
        badge.innerText = role === 'master' ? '👑 MASTER VIP' : role.toUpperCase();
    }

    // ── Date formatter ──
    function fmtDate(val) {
        if (!val) return '-';
        let d;
        if (typeof val === 'number') { d = new Date(val); }
        else if (!isNaN(val) && String(val).length >= 10) { d = new Date(parseInt(val)); }
        else { d = new Date(val); }
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
    }

    // ── Premium expiry check & auto-demotion ──
    function checkPremiumExpiry(uid, prn, role) {
        if (!PREMIUM_ROLES.includes(role)) return;   // only check for paid roles

        rtdb.ref('premium').orderByChild('uid').equalTo(uid).once('value').then((snap) => {
            if (!snap.exists()) return;
            const key      = Object.keys(snap.val())[0];
            const planData = snap.val()[key];
            const plan     = planData.plan || role;

            // Pull expiry from any common key name
            const expiryRaw = planData.expiryDate || planData.expiry_date || planData.endDate
                            || planData.expiresOn  || planData.expiry;

            // Show in sidebar
            const activation = planData.activationDate || planData.activation_date
                              || planData.startDate    || planData.activatedOn || planData.activation;
            document.getElementById('menuUserPlan').innerText      = plan.toUpperCase();
            document.getElementById('menuActivationDate').innerText = activation ? fmtDate(activation) : '-';
            document.getElementById('menuExpiryDate').innerText    = expiryRaw  ? fmtDate(expiryRaw)  : '-';

            if (!expiryRaw) return;

            // Parse expiry to timestamp
            let expiryTs;
            if (typeof expiryRaw === 'number') { expiryTs = expiryRaw; }
            else if (!isNaN(expiryRaw) && String(expiryRaw).length >= 10) { expiryTs = parseInt(expiryRaw); }
            else { expiryTs = new Date(expiryRaw).getTime(); }

            if (isNaN(expiryTs)) return;

            if (Date.now() > expiryTs) {
                // ── Expired → demote to student ──
                if (prn) {
                    fetch('https://studybuddypro-psi.vercel.app/api/backend?action=demote-role', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prn }) }).catch(console.error);
                }
                currentUserRole = 'student';
                applyMenuRoleStyle('student');
                document.getElementById('expiredModal').classList.add('active');
            }
        }).catch(console.error);
    }

    // ── Supabase auth listener ──
    auth.onAuthStateChanged((user) => {
        const nameEl = document.getElementById('menuUserName');
        const prnEl  = document.getElementById('menuUserPRN');

        if (user) {
            rtdb.ref('users').orderByChild('uid').equalTo(user.uid).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const prn      = Object.keys(snapshot.val())[0];
                    const data     = snapshot.val()[prn];
                    const role     = data.role ? data.role.trim().toLowerCase() : 'student';
                    currentUserRole = role;
                    currentUserPRN  = prn;

                    nameEl.innerText = data.name || user.email.split('@')[0];
                    prnEl.innerText  = prn;
                    applyMenuRoleStyle(role);
                    updateModCardUI(role);
                    checkAccessGate(role);
                    checkPremiumExpiry(user.uid, prn, role);
                } else {
                    currentUserRole = 'student';
                    nameEl.innerText = user.email ? user.email.split('@')[0] : 'Student';
                    prnEl.innerText  = '-';
                    applyMenuRoleStyle('student');
                    updateModCardUI('student');
                    checkAccessGate('student');
                    document.getElementById('menuUserPlan').innerText = '-';
                }
            }, (err) => console.error('Profile sync:', err));
        } else {
            currentUserRole = 'guest';
            nameEl.innerText = 'Guest User';
            prnEl.innerText  = '-';
            applyMenuRoleStyle('guest');
            updateModCardUI('guest');
            checkAccessGate('guest');
            document.getElementById('menuUserPlan').innerText = '-';
        }
    });
