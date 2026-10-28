
        const rtdb = SBZLegacy.database();

        // ── MAINTENANCE ──
        rtdb.ref('site_config/maintenance/sy').on('value', snap => {
            const overlay = document.getElementById('maintenanceOverlay');
            if (snap.exists() && snap.val() === true) { overlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
            else { overlay.classList.remove('show'); document.body.style.overflow = ''; }
        });

        // ── NOTIFICATION TICKER ──
        rtdb.ref('site_config/notification').on('value', snap => {
            const t = document.getElementById('notificationTickerText');
            t.innerHTML = (snap.exists() && snap.val())
                ? snap.val() + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
                : 'Welcome to studybuddypremiumpro! 🎓 Stay tuned for updates. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
        });

        function escapeHtml(s) {
            return (s || '').toString()
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        // ── CONTENT RENDERER ──
        function renderContent(containerId, data, emptyMsg) {
            const el = document.getElementById(containerId);
            if (!el) return;
            if (!data || Object.keys(data).length === 0) {
                el.innerHTML = '<div class="card-empty">📭 ' + emptyMsg + '</div>'; return;
            }
            el.innerHTML = Object.entries(data).map(([k, v]) => {
                const title = (typeof v === 'object' ? v.title || v.name || k : v) || k;
                const url   = (typeof v === 'object' && v.url)  ? v.url  : '#';
                const type  = (typeof v === 'object' && v.type) ? v.type : 'pdf';
                const icon  = type === 'video' ? 'fa-play-circle' : 'fa-file-pdf';
                const lbl   = type === 'video' ? 'Video' : 'PDF';
                const isPdf = type === 'pdf';
                const pdfAttrs = isPdf
                    ? `href="javascript:void(0)" data-pdf-url="${escapeHtml(url)}" data-pdf-name="${escapeHtml(title)}" onclick="openPdfViewer(this.dataset.pdfUrl, this.dataset.pdfName)"`
                    : `href="${sbzUrl(url)}" target="_blank"`;
                return `<a class="card-content-item" ${pdfAttrs} rel="noopener">
                    <div class="card-content-item-left"><i class="fa-solid ${icon}"></i><span>${title}</span></div>
                    <span class="card-content-item-right">${lbl}</span></a>`;
            }).join('');
        }

        // ── (purana FREE card helper — ab use nahi hota; Sem III Gold-locked hai) ──
        function unlockFreeCard() {
            const card = document.getElementById('card-third');
            if (card) card.classList.add('unlocked');
            rtdb.ref('SY/mech/sem3').on('value', snap => renderContent('thirdContent', snap.val(), 'No Sem III content yet'));
        }
        // Sem III ab Gold-locked hai — sirf unlockAllCards() (Gold user) isko kholta hai.

        // ── UNLOCK ALL 4 CARDS (Gold user) ──
        function unlockAllCards() {
            ['third','fourth','notes','piqs'].forEach(id => {
                const lock = document.getElementById('lock-' + id);
                if (lock) lock.remove();
                const card = document.getElementById('card-' + id);
                if (card) card.classList.add('unlocked');
            });
            // Now fetch Supabase data
            rtdb.ref('SY/mech/sem3').on('value', snap => renderContent('thirdContent', snap.val(), 'No Sem III content yet'));
            rtdb.ref('SY/mech/sem4').on('value', snap => renderContent('fourthContent', snap.val(), 'No Sem IV content yet'));
            rtdb.ref('SY/mech/notes').on('value', snap => renderContent('notesContent', snap.val(), 'No notes uploaded yet'));
            rtdb.ref('SY/mech/piqs').on('value', snap => renderContent('piqsContent', snap.val(), 'No PIQs uploaded yet'));
            // Show gold unlocked toast
            showToast('👑 Gold Unlocked', 'Welcome! All content is now accessible.', 'gold');
        }

        // ── AUTH ──
        SBZLegacy.auth().onAuthStateChanged(user => {
            if (!user) {
                // Not logged in — keep all locked, hide loading spinners
                ['fourthContent','notesContent','piqsContent'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = '<div class="card-empty">🔒 Login required</div>';
                });
                return;
            }
            window._userEmail = user.email || '';

            rtdb.ref('users').orderByChild('uid').equalTo(user.uid).on('value', querySnap => {
                if (!querySnap.exists()) return;
                let data = null;
                querySnap.forEach(child => { data = child.val(); });

                const name = data.name || data.displayName || (user.email ? user.email.split('@')[0] : 'Student');
                window._userName = name;

                // Role check — gold (case-insensitive)
                const roleStr = (data.role || '').toString().toLowerCase().trim();
                // Gold roles: 'gold' + all admin/super roles also get access
                const goldRoles = ['gold','admin','superadmin','super admin','super-admin','master'];
                const isGold = goldRoles.includes(roleStr);

                // Update header & sidebar
                const menuName = document.getElementById('menuUserName');
                const menuRole = document.getElementById('menuUserRole');
                const headerTitle = document.getElementById('headerTitle');
                if (menuName) menuName.textContent = name;
                if (menuRole) { menuRole.textContent = isGold ? '👑 Gold' : roleStr.toUpperCase() || 'Mechanical'; menuRole.style.background = isGold ? 'linear-gradient(135deg,#d4a017,#f0b429)' : ''; }
                if (headerTitle) headerTitle.innerHTML = name + ' — <span>Mechanical</span>';

                // Update profile sheet
                const pName  = document.getElementById('profileSheetName');
                const pEmail = document.getElementById('profileSheetEmail');
                const pGold  = document.getElementById('profileGoldBadge');
                const pFree  = document.getElementById('profileFreeBadge');
                const pMem   = document.getElementById('profileMembership');
                if (pName)  pName.textContent  = name;
                if (pEmail) pEmail.textContent = user.email || '—';
                if (pGold)  pGold.style.display  = isGold ? 'inline-block' : 'none';
                if (pFree)  pFree.style.display   = isGold ? 'none' : 'inline-block';
                if (pMem)   pMem.textContent = isGold ? '👑 Gold Member' : 'Free';

                if (isGold) {
                    unlockAllCards();
                } else {
                    // Not gold — show empty state on content areas (locks already visible)
                    ['fourthContent','notesContent','piqsContent'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.innerHTML = '<div class="card-empty">🔒 Gold members only</div>';
                    });
                }
            });
        });
    