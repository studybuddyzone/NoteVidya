
        document.documentElement.setAttribute('data-theme', 'light');
        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const icon = document.getElementById('themeIcon');
            if (current === 'dark') {
                document.documentElement.setAttribute('data-theme', 'light');
                icon.className = 'fa-solid fa-moon';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                icon.className = 'fa-solid fa-sun';
            }
        }
        function openSidebar() { document.getElementById('mySidebar').classList.add('active'); document.getElementById('sidebarOverlay').style.display = 'block'; }
        function closeSidebar() { document.getElementById('mySidebar').classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; }
        function showPremiumNotification(title, message, isError) {
            const toast = document.getElementById('universalPremiumToast');
            const icon = document.getElementById('toastIconElement');
            document.getElementById('toastHeaderTitle').innerText = title;
            document.getElementById('toastMessageText').innerText = message;
            if (isError) { toast.className = 'premium-toast toast-error active'; icon.className = 'fa-solid fa-triangle-exclamation'; }
            else { toast.className = 'premium-toast toast-success active'; icon.className = 'fa-solid fa-circle-check'; }
            setTimeout(() => { toast.classList.remove('active'); }, 2500);
        }
    