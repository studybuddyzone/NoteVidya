
        const rtdb = SBZLegacy.database();

        // 🔧 MAINTENANCE MODE — Final Year key
        rtdb.ref('site_config/maintenance/ffy').on('value', (snap) => {
            const overlay = document.getElementById('maintenanceOverlay');
            const isUnderMaintenance = snap.exists() && snap.val() === true;
            if (isUnderMaintenance) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            } else {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });

        // 📢 Notification Bar
        rtdb.ref('site_config/notification').on('value', (snap) => {
            const ticker = document.getElementById('notificationTickerText');
            if (snap.exists() && snap.val()) {
                ticker.innerHTML = snap.val() + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            } else {
                ticker.innerHTML = 'Welcome to Study Buddy Pro! 🎓 Stay tuned for important updates. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            }
        });
    