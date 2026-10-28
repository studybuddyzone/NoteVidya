
    const ALLOWED_ROLES = ['gold','diamond','master','superadmin','admin','moderator'];
    const MOD_ROLES     = ['admin','superadmin','master','moderator'];
    const PREMIUM_ROLES = ['gold','diamond','silver'];

    let currentUserRole = 'guest';
    let currentUserPRN  = null;

    // Sidebar
    function openSidebar()  { document.getElementById('mySidebar').classList.add('active'); document.getElementById('sidebarOverlay').classList.add('active'); }
    function closeSidebar() { document.getElementById('mySidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); }

    // Access gate
    function checkAccessGate(role) {
        if (!ALLOWED_ROLES.includes(role)) {
            document.getElementById('gateRoleTag').innerText = 'Your role: ' + role.toUpperCase();
            document.getElementById('premiumGate').classList.add('active');
        }
    }

    // Expired modal
    function closeExpiredModal() {
        document.getElementById('expiredModal').classList.remove('active');
        checkAccessGate(currentUserRole);
    }

    // Premium answer card click
    function openPremiumAnswer() {
        openSubjectPdfList('Civil', 'answer-key', 'Civil Answer Keys');
    }

    // Mod card
    function closeModLockedModal() { document.getElementById('modLockedModal').classList.remove('active'); }
    function handleModCard() {
        if (MOD_ROLES.includes(currentUserRole)) {
            openSubjectPdfList('Civil', 'answer-key-mod', 'Civil Answer Keys (Moderator)');
        } else {
            document.getElementById('modLockedModal').classList.add('active');
        }
    }

    function updateModCardUI(role) {
        const card  = document.getElementById('modCard');
        const badge = document.getElementById('modLockBadge');
        const arrow = document.getElementById('modArrowIcon');
        const sub   = document.getElementById('modCardSub');
        if (MOD_ROLES.includes(role)) {
            card.classList.add('unlocked');
            badge.style.display = 'none';
            arrow.className = 'fa-solid fa-chevron-right';
            sub.innerText = 'Tap to open Moderator Answer Keys';
        } else {
            card.classList.remove('unlocked');
            badge.style.display = '';
            arrow.className = 'fa-solid fa-lock';
            sub.innerText = 'Only Moderators & above can access this section';
        }
    }

    // Role badge colour
    function applyMenuRoleStyle(role) {
        const badge = document.getElementById('menuUserRole');
        const c = { master:['#000','#f59e0b'], superadmin:['#e11d48','#fff'], admin:['#a855f7','#fff'],
                     moderator:['#06b6d4','#fff'], diamond:['#ec4899','#fff'], gold:['#4f46e5','#fff'],
                     silver:['#f59e0b','#fff'], student:['#64748b','#fff'], guest:['#64748b','#fff'] };
        const col = c[role] || c.student;
        badge.style.background = col[0]; badge.style.color = col[1];
        badge.innerText = role === 'master' ? '👑 MASTER VIP' : role.toUpperCase();
    }

    function fmtDate(val) {
        if (!val) return '-';
        let d;
        if (typeof val === 'number') { d = new Date(val); }
        else if (!isNaN(val) && String(val).length >= 10) { d = new Date(parseInt(val)); }
        else { d = new Date(val); }
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
    }

    // Premium expiry check & auto-demotion
    function checkPremiumExpiry(uid, prn, role) {
        if (!PREMIUM_ROLES.includes(role)) return;
        rtdb.ref('premium').orderByChild('uid').equalTo(uid).once('value').then((snap) => {
            if (!snap.exists()) return;
            const key      = Object.keys(snap.val())[0];
            const planData = snap.val()[key];
            const plan     = planData.plan || role;
            const activation = planData.activationDate || planData.activation_date || planData.startDate || planData.activatedOn || planData.activation;
            const expiryRaw  = planData.expiryDate || planData.expiry_date || planData.endDate || planData.expiresOn || planData.expiry;

            document.getElementById('menuUserPlan').innerText       = plan.toUpperCase();
            document.getElementById('menuActivationDate').innerText = activation ? fmtDate(activation) : '-';
            document.getElementById('menuExpiryDate').innerText     = expiryRaw  ? fmtDate(expiryRaw)  : '-';

            if (!expiryRaw) return;
            let expiryTs;
            if (typeof expiryRaw === 'number') { expiryTs = expiryRaw; }
            else if (!isNaN(expiryRaw) && String(expiryRaw).length >= 10) { expiryTs = parseInt(expiryRaw); }
            else { expiryTs = new Date(expiryRaw).getTime(); }
            if (isNaN(expiryTs)) return;

            if (Date.now() > expiryTs) {
                if (prn) { fetch('https://studybuddypro-psi.vercel.app/api/backend?action=demote-role', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prn }) }).catch(console.error); }
                currentUserRole = 'student';
                applyMenuRoleStyle('student');
                document.getElementById('expiredModal').classList.add('active');
            }
        }).catch(console.error);
    }

    // Supabase auth listener
    auth.onAuthStateChanged((user) => {
        const nameEl = document.getElementById('menuUserName');
        const prnEl  = document.getElementById('menuUserPRN');
        if (user) {
            rtdb.ref('users').orderByChild('uid').equalTo(user.uid).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const prn  = Object.keys(snapshot.val())[0];
                    const data = snapshot.val()[prn];
                    const role = data.role ? data.role.trim().toLowerCase() : 'student';
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
