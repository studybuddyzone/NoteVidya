
        // Theme
        const savedTheme = localStorage.getItem('sbz_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeIcon').className = savedTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';

        function toggleTheme() {
            const cur = document.documentElement.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            document.getElementById('themeIcon').className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            localStorage.setItem('sbz_theme', next);
        }

        // Sidebar
        function openSidebar() {
            document.getElementById('sidebar').classList.add('open');
            document.getElementById('sidebarOverlay').classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeSidebar() {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('open');
            document.body.style.overflow = '';
        }

        // ESC
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeSidebar();
        });

        // Subject buttons → each now opens that subject's Answer Key PDFs
        // from the dashboard's Management system (same source the
        // individual answerkeyXXX.html pages read from).
        const subjectLinks = {
            physics:   'Physics',
            egh:       'Graphics',
            beee:      'BEE',
            bcme:      'Civil',
            chemistry: 'Chemistry',
            pps:       'PNPS',
            mhc:       'Mechanics',
            cms:       'Communication',
            m1:        'M1',
            m2:        'M2',
        };

        let toastTimer;
        function openSubject(key) {
            const subject = subjectLinks[key];
            if (subject) { openSubjectPdfList(subject, 'answer-key', subject + ' Answer Keys'); return; }
            showToast('Answer key for this subject coming soon!');
        }

        function showToast(msg) {
            clearTimeout(toastTimer);
            const t = document.getElementById('toast');
            document.getElementById('toastMsg').textContent = msg;
            t.style.opacity = '1';
            t.style.transform = 'translateX(-50%) translateY(0)';
            toastTimer = setTimeout(() => {
                t.style.opacity = '0';
                t.style.transform = 'translateX(-50%) translateY(80px)';
            }, 2800);
        }

        // Show expired popup
        function showExpiredPopup() {
            const m = document.getElementById('expiredModal');
            m.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        // Exit / switch PRN
        function clearSessionAndExit() {
            sessionStorage.removeItem('sbz_verified_prn');
            window.location.href = 'material-hub';
        }
    