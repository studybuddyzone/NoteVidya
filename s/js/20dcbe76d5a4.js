
        // Theme
        document.documentElement.setAttribute('data-theme', 'light');

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', target);
            document.getElementById('themeIcon').className = target === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }

        // Overlay
        function openOverlay(id) {
            const overlay = document.getElementById(id);
            // Reset child animations each time
            const items = overlay.querySelectorAll('.overlay-list .proceed-box-link');
            items.forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight; // reflow
                el.style.animation = '';
            });
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeOverlay(id) {
            const overlay = document.getElementById(id);
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // ESC key to close
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.overlay-container.active').forEach(el => {
                    closeOverlay(el.id);
                });
                closePrnModal();
                closeUpgradeModal();
            }
        });

        /* ─── Answer Key Modal ─── */
        function openAnswerKeyModal() {
            const modal = document.getElementById('prnModal');
            modal.style.display = 'flex';
            document.getElementById('prnInput').value = '';
            document.getElementById('prnError').style.display = 'none';
            document.body.style.overflow = 'hidden';
            setTimeout(() => document.getElementById('prnInput').focus(), 100);
        }

        function closePrnModal() {
            document.getElementById('prnModal').style.display = 'none';
            document.body.style.overflow = '';
        }

        function closeUpgradeModal() {
            document.getElementById('upgradeModal').style.display = 'none';
            document.body.style.overflow = '';
        }

        function goToPremium() {
            window.location.href = 'up-premium';
        }

        function showError(msg) {
            const el = document.getElementById('prnError');
            el.textContent = msg;
            el.style.display = 'block';
        }

        async function verifyPRN() {
            const prn = document.getElementById('prnInput').value.trim();
            if (!prn) { showError('⚠️ Please enter your PRN number.'); return; }

            const btn = document.getElementById('verifyBtn');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
            btn.disabled = true;
            document.getElementById('prnError').style.display = 'none';

            try {
                const role = await window._verifyPRNSession(prn);

                if (!role) {
                    window.location.href = "/";
                    return;
                }

                const ALLOWED = ['master','superadmin','moderator','diamond','admin','gold'];

                if (ALLOWED.includes(role)) {
                    // ✅ Access granted → redirect
                    closePrnModal();
                    sessionStorage.setItem('sbz_verified_prn', prn.trim().toUpperCase());
                    window.location.href = 'answer';
                } else {
                    // 🔒 Restricted → show upgrade popup
                    closePrnModal();
                    document.getElementById('upgradeModal').style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Verify & Continue';
                    btn.disabled = false;
                }
            } catch(err) {
                showError('⚠️ Network error. Please try again.');
                btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Verify & Continue';
                btn.disabled = false;
            }
        }
    