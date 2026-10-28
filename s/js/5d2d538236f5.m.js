
                const rtdb = SBZLegacy.database();
        const ref = (d, path) => d.ref(path);
        const get = (r) => r.once('value');

        // Roles that get FULL ACCESS
        const ALLOWED_ROLES = ['master','superadmin','moderator','diamond','admin','gold'];
        // Roles that are RESTRICTED
        const RESTRICTED_ROLES = ['guest','student','silver'];

        window._verifyPRNSession = async function(prn) {
            prn = prn.trim().toUpperCase();
            let role = null;

            // 1️⃣ Check Realtime Database first
            try {
                const snap = await get(ref(rtdb, `users/${prn}`));
                if (snap.exists()) {
                    const data = snap.val();
                    role = (data.role || '').toLowerCase();
                }
            } catch(e) { /* ignore, ignore */ }

            return role; // null if not found
        };
    