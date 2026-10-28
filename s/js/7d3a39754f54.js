
    function openSidebar() { document.getElementById('mySidebar').classList.add('active'); document.getElementById('sidebarOverlay').classList.add('active'); }
    function closeSidebar() { document.getElementById('mySidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); }

    function formatMenuDate(value) {
        if (!value) return "-";
        let d;
        if (typeof value === "number") { d = new Date(value); }
        else if (!isNaN(value) && value.toString().length >= 10) { d = new Date(parseInt(value)); }
        else { d = new Date(value); }
        if (isNaN(d.getTime())) return value.toString();
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function applyMenuRoleStyle(role) {
        const badge = document.getElementById('menuUserRole');
        const colors = {
            master: ['#000000', '#f59e0b'], superadmin: ['#e11d48', '#ffffff'], admin: ['#a855f7', '#ffffff'],
            moderator: ['#06b6d4', '#ffffff'], diamond: ['#ec4899', '#ffffff'], gold: ['#4f46e5', '#ffffff'],
            silver: ['#f59e0b', '#ffffff'], student: ['#64748b', '#ffffff'], guest: ['#64748b', '#ffffff']
        };
        const c = colors[role] || colors.student;
        badge.style.background = c[0]; badge.style.color = c[1];
        badge.innerText = role === 'master' ? 'MASTER VIP' : role.toUpperCase();
    }

    function fetchMenuPremiumDetails(uid, role) {
        const planEl = document.getElementById('menuUserPlan');
        const activationEl = document.getElementById('menuActivationDate');
        const expiryEl = document.getElementById('menuExpiryDate');
        const premiumRoles = ['gold', 'diamond', 'silver'];
        if (!premiumRoles.includes(role)) {
            planEl.innerText = role.toUpperCase(); activationEl.innerText = '-'; expiryEl.innerText = '-';
            return;
        }
        rtdb.ref('premium').orderByChild('uid').equalTo(uid).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const key = Object.keys(snapshot.val())[0];
                const planData = snapshot.val()[key];
                const activation = planData.activationDate || planData.activation_date || planData.startDate || planData.activatedOn || planData.activation;
                const expiry = planData.expiryDate || planData.expiry_date || planData.endDate || planData.expiresOn || planData.expiry;
                planEl.innerText = (planData.plan || role).toString().toUpperCase();
                activationEl.innerText = activation ? formatMenuDate(activation) : '-';
                expiryEl.innerText = expiry ? formatMenuDate(expiry) : '-';
            } else {
                planEl.innerText = role.toUpperCase(); activationEl.innerText = '-'; expiryEl.innerText = '-';
            }
        }).catch(() => {
            planEl.innerText = role.toUpperCase(); activationEl.innerText = '-'; expiryEl.innerText = '-';
        });
    }

    // Auto-fetch the logged-in user's profile (name, role, PRN, subscription validity)
    // the moment they land here — same Supabase Auth session carries over from fy.html.

        const ALLOWED_ROLES = ['gold','diamond','master','superadmin','admin','moderator'];

        function checkAccessGate(role) {
            const gate = document.getElementById('premiumGate');
            if (ALLOWED_ROLES.includes(role)) {
                gate.classList.remove('active');
            } else {
                document.getElementById('gateRoleTag').innerText = 'Your role: ' + role.toUpperCase();
                gate.classList.add('active');
            }
        }
    auth.onAuthStateChanged((user) => {
        const nameEl = document.getElementById('menuUserName');
        const prnEl = document.getElementById('menuUserPRN');
        if (user) {
            rtdb.ref('users').orderByChild('uid').equalTo(user.uid).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const prnKey = Object.keys(snapshot.val())[0];
                    const userData = snapshot.val()[prnKey];
                    const role = userData.role ? userData.role.trim().toLowerCase() : 'student';
                    nameEl.innerText = userData.name || user.email.split('@')[0];
                    prnEl.innerText = prnKey;
                    applyMenuRoleStyle(role);
                    fetchMenuPremiumDetails(user.uid, role);
                    checkAccessGate(role);
                } else {
                    nameEl.innerText = user.email ? user.email.split('@')[0] : 'Student';
                    prnEl.innerText = '-';
                    applyMenuRoleStyle('student');
                    fetchMenuPremiumDetails(user.uid, 'student');
                    checkAccessGate('student');
                }
            }, (error) => { console.error('Profile sync issue:', error); });
        } else {
            nameEl.innerText = 'Guest User';
            prnEl.innerText = '-';
            applyMenuRoleStyle('guest');
            document.getElementById('menuUserPlan').innerText = '-';
            checkAccessGate('guest');
        }
    });
  