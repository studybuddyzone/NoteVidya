
        const rtdb = SBZLegacy.database();

        // Question Bank + Answer Bank → shared config in sy-resources.js
        // (subject lists + Silver / Gold tier rules live there, one place for all branches).

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

        // ── UNLOCK HELPERS ──
        function unlockGroup(ids) {
            ids.forEach(id => {
                const lock = document.getElementById('lock-' + id);
                if (lock) lock.remove();
                const card = document.getElementById('card-' + id);
                if (card) card.classList.add('unlocked');
            });
        }

        // ── UNLOCK SILVER CARDS (Question Bank) ──
        function unlockSilverCards() {
            unlockGroup(['qb']);
        }

        // ── UNLOCK GOLD CARDS (Same Third / Same Fourth / Answer Bank) ──
        function unlockGoldCards() {
            unlockGroup(['third-subjects','fourth-subjects','qb','answers']);
        }

        // ── AUTH ──
        SBZLegacy.auth().onAuthStateChanged(user => {
            if (!user) {
                // Not logged in — keep all locked
                return;
            }
            window._userEmail = user.email || '';

            rtdb.ref('users').orderByChild('uid').equalTo(user.uid).on('value', querySnap => {
                if (!querySnap.exists()) return;
                let data = null;
                querySnap.forEach(child => { data = child.val(); });

                const name = data.name || data.displayName || (user.email ? user.email.split('@')[0] : 'Student');
                window._userName = name;

                // Role check (case-insensitive)
                const roleStr = (data.role || '').toString().toLowerCase().trim();
                // Gold roles: 'gold' + 'diamond' (higher tier) + all admin/super roles also get access
                const goldRoles = SY_RESOURCES.SECTIONS.answerBank.roles;
                // Silver roles: 'silver' + gold + diamond + admin/super roles (Question Bank)
                const silverRoles = ['silver'].concat(goldRoles); // sirf badge/label ke liye — content ab Gold se shuru
                // Diamond roles: 'diamond' + all admin/super roles also get access
                const diamondRoles = ['diamond','admin','superadmin','super admin','super-admin','master'];
                const isGold = goldRoles.includes(roleStr);
                const isSilver = silverRoles.includes(roleStr);
                const isDiamond = diamondRoles.includes(roleStr);

                // Update header & sidebar (show highest tier badge)
                const menuName = document.getElementById('menuUserName');
                const menuRole = document.getElementById('menuUserRole');
                const headerTitle = document.getElementById('headerTitle');
                if (menuName) menuName.textContent = name;
                if (menuRole) {
                    if (isDiamond) { menuRole.textContent = '💎 Diamond'; menuRole.style.background = 'linear-gradient(135deg,#0891b2,#22d3ee)'; }
                    else if (isGold) { menuRole.textContent = '👑 Gold'; menuRole.style.background = 'linear-gradient(135deg,#d4a017,#f0b429)'; }
                    else if (isSilver) { menuRole.textContent = '🥈 Silver'; menuRole.style.background = 'linear-gradient(135deg,#78909c,#b0bec5)'; }
                    else { menuRole.textContent = roleStr.toUpperCase() || 'Civil'; menuRole.style.background = ''; }
                }
                if (headerTitle) headerTitle.innerHTML = name + ' — <span>Civil</span>';

                // Update profile sheet
                const pName    = document.getElementById('profileSheetName');
                const pEmail   = document.getElementById('profileSheetEmail');
                const pGold    = document.getElementById('profileGoldBadge');
                const pDiamond = document.getElementById('profileDiamondBadge');
                const pSilver  = document.getElementById('profileSilverBadge');
                const pFree    = document.getElementById('profileFreeBadge');
                const pMem     = document.getElementById('profileMembership');
                if (pName)  pName.textContent  = name;
                if (pEmail) pEmail.textContent = user.email || '—';
                if (pGold)    pGold.style.display    = (isGold && !isDiamond) ? 'inline-block' : 'none';
                if (pSilver)  pSilver.style.display  = (isSilver && !isGold) ? 'inline-block' : 'none';
                if (pDiamond) pDiamond.style.display  = isDiamond ? 'inline-block' : 'none';
                if (pFree)    pFree.style.display     = isSilver ? 'none' : 'inline-block';
                if (pMem)   pMem.textContent = isDiamond ? '💎 Diamond Member' : (isGold ? '👑 Gold Member' : (isSilver ? '🥈 Silver Member' : 'Free'));

                // Question Bank — ab Gold tier (gold / diamond / admin)

                // Same Third / Same Fourth / Answer Bank — Gold tier (gold / diamond / admin)
                if (isGold) {
                    unlockGoldCards();
                    showToast('👑 Gold Unlocked', 'Same Third, Same Fourth, Question Bank & Answer Bank are now accessible.', 'gold');
                }
            });
        });
    