
        document.documentElement.setAttribute('data-theme','light');
        function toggleTheme() {
            const cur = document.documentElement.getAttribute('data-theme');
            const icon = document.getElementById('themeIcon');
            if (cur === 'dark') { document.documentElement.setAttribute('data-theme','light'); icon.className = 'fa-solid fa-moon'; }
            else { document.documentElement.setAttribute('data-theme','dark'); icon.className = 'fa-solid fa-sun'; }
        }
        function openSidebar()  { document.getElementById('mySidebar').classList.add('active'); document.getElementById('sidebarOverlay').style.display = 'block'; }
        function closeSidebar() { document.getElementById('mySidebar').classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; }
        // Lock-aware tap handler: while the card's lock badge exists, tapping it
        // shows the Gold/Diamond popup instead of navigating; once unlocked (lock
        // badge removed by the auth check below), it runs the real action.
        function cardTap(id, tier, action) {
            var lock = document.getElementById('lock-' + id);
            if (lock) {
                if (tier === 'diamond') { openDiamondSheet(); } else { openGoldSheet(); }
                return;
            }
            if (typeof action === 'function') action();
        }

        function openGoldSheet()  { document.getElementById('goldBackdrop').classList.add('open'); document.getElementById('goldSheet').classList.add('open'); document.body.style.overflow = 'hidden'; }
        function closeGoldSheet() { document.getElementById('goldBackdrop').classList.remove('open'); document.getElementById('goldSheet').classList.remove('open'); document.body.style.overflow = ''; }
        function openProfileSheet()  { document.getElementById('profileSheetBackdrop').classList.add('open'); document.getElementById('profileSheet').classList.add('open'); document.body.style.overflow = 'hidden'; }
        function closeProfileSheet() { document.getElementById('profileSheetBackdrop').classList.remove('open'); document.getElementById('profileSheet').classList.remove('open'); document.body.style.overflow = ''; }
        function showToast(title, message, type) {
            const toast = document.getElementById('universalPremiumToast');
            const icon  = document.getElementById('toastIconElement');
            document.getElementById('toastHeaderTitle').innerText = title;
            document.getElementById('toastMessageText').innerText  = message;
            if (type === 'gold')  { toast.className = 'premium-toast toast-gold active'; icon.className = 'fa-solid fa-crown'; }
            else if (type === true) { toast.className = 'premium-toast toast-error active'; icon.className = 'fa-solid fa-triangle-exclamation'; }
            else { toast.className = 'premium-toast toast-success active'; icon.className = 'fa-solid fa-circle-check'; }
            setTimeout(() => toast.classList.remove('active'), 2800);
        }
    