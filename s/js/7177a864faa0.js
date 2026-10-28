
        document.documentElement.setAttribute('data-theme', 'light');

        // Theme Switcher Logic
        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', target);
            document.getElementById('themeIcon').className = target === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }

        // Overlay State Control Functions
        function openOverlay(id) {
            document.getElementById(id).classList.add('active');
        }
        function closeOverlay(id) {
            document.getElementById(id).classList.remove('active');
        }
    