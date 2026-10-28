
        const rtdb = SBZLegacy.database();

        // ── MAINTENANCE ──
        rtdb.ref('site_config/maintenance/ty').on('value', snap => {
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

        // ── BRANCH GUARD — this page belongs to ONLY this branch ──
        const THIS_PAGE_BRANCH = 'cs';
        const BRANCH_LABELS = { civil:'Civil Engg.', cs:'Computer Science', aiml:'AI/ML & AI/DS', entc:'Electronics & Telecom', electrical:'Electrical Engg.' };
        function showBranchLockOverlay(myBranch) {
            const ov = document.getElementById('branchLockOverlay');
            if (!ov) return;
            const lbl = document.getElementById('bloMyBranch');
            if (lbl) lbl.textContent = myBranch ? (BRANCH_LABELS[myBranch] || myBranch.toUpperCase()) : 'अभी तक select नहीं की';
            ov.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
        function hideBranchLockOverlay() {
            const ov = document.getElementById('branchLockOverlay');
            if (!ov) return;
            ov.classList.remove('show');
            document.body.style.overflow = '';
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

        // ── UNLOCK GOLD CARDS (Same Fifth / Same Sixth — subject-wise redirect cards) ──
        function unlockGoldCards() {
            unlockGroup(['fifth-subjects','sixth-subjects']);
            showToast('👑 Gold Unlocked', 'Same Fifth & Same Sixth are now accessible.', 'gold');
        }

        // ── UNLOCK DIAMOND CARDS (Notes / PIQs) ──
        function unlockDiamondCards() {
            unlockGroup(['notes','piqs']);
            rtdb.ref('TY/cs/piqs').on('value', snap => renderContent('piqsContent', snap.val(), 'No PIQs uploaded yet'));
            showToast('💎 Diamond Unlocked', 'Notes & PIQs are now accessible.', 'diamond');
        }

        // ── AUTH ──
        SBZLegacy.auth().onAuthStateChanged(user => {
            if (!user) {
                // Not logged in — keep all locked, hide loading spinners
                ['notesContent','piqsContent'].forEach(id => {
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

                // ✅ BRANCH GUARD — sirf apni selected branch ka hi content dikhna chahiye.
                // Admin/master roles ke liye sab branches bypass; baaki sab ke liye strict match.
                const registeredBranch = (data.branch || data.selectedBranch || data.branchCode || data.Branch || '').toString().toLowerCase().trim();
                const roleForGuard = (data.role || '').toString().toLowerCase().trim();
                const adminRolesForGuard = ['admin','superadmin','super admin','super-admin','master'];
                const isAdminForGuard = adminRolesForGuard.includes(roleForGuard);
                if (!isAdminForGuard && registeredBranch !== THIS_PAGE_BRANCH) {
                    showBranchLockOverlay(registeredBranch);
                    return; // stop here — is user ko is page ka koi content nahi dikhana
                }
                hideBranchLockOverlay();

                const name = data.name || data.displayName || (user.email ? user.email.split('@')[0] : 'Student');
                window._userName = name;

                // Role check (case-insensitive)
                const roleStr = (data.role || '').toString().toLowerCase().trim();
                // Gold roles: 'gold' + 'diamond' (higher tier) + all admin/super roles also get access
                const goldRoles = ['gold','diamond','admin','superadmin','super admin','super-admin','master'];
                // Diamond roles: 'diamond' + all admin/super roles also get access
                const diamondRoles = ['diamond','admin','superadmin','super admin','super-admin','master'];
                const isGold = goldRoles.includes(roleStr);
                const isDiamond = diamondRoles.includes(roleStr);

                // Update header & sidebar (show highest tier badge)
                const menuName = document.getElementById('menuUserName');
                const menuRole = document.getElementById('menuUserRole');
                const headerTitle = document.getElementById('headerTitle');
                if (menuName) menuName.textContent = name;
                if (menuRole) {
                    if (isDiamond) { menuRole.textContent = '💎 Diamond'; menuRole.style.background = 'linear-gradient(135deg,#0891b2,#22d3ee)'; }
                    else if (isGold) { menuRole.textContent = '👑 Gold'; menuRole.style.background = 'linear-gradient(135deg,#d4a017,#f0b429)'; }
                    else { menuRole.textContent = roleStr.toUpperCase() || 'CS'; menuRole.style.background = ''; }
                }
                if (headerTitle) headerTitle.innerHTML = name + ' — <span>CS</span>';

                // Update profile sheet
                const pName    = document.getElementById('profileSheetName');
                const pEmail   = document.getElementById('profileSheetEmail');
                const pGold    = document.getElementById('profileGoldBadge');
                const pDiamond = document.getElementById('profileDiamondBadge');
                const pFree    = document.getElementById('profileFreeBadge');
                const pMem     = document.getElementById('profileMembership');
                if (pName)  pName.textContent  = name;
                if (pEmail) pEmail.textContent = user.email || '—';
                if (pGold)    pGold.style.display    = isGold ? 'inline-block' : 'none';
                if (pDiamond) pDiamond.style.display  = isDiamond ? 'inline-block' : 'none';
                if (pFree)    pFree.style.display     = (isGold || isDiamond) ? 'none' : 'inline-block';
                if (pMem)   pMem.textContent = isDiamond ? '💎 Diamond Member' : (isGold ? '👑 Gold Member' : 'Free');

                // Same Fifth / Same Sixth — Gold tier
                if (isGold) {
                    unlockGoldCards();
                }

                // Notes / PIQs — Diamond tier
                if (isDiamond) {
                    unlockDiamondCards();
                } else {
                    ['piqsContent'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.innerHTML = '<div class="card-empty">🔒 Diamond members only</div>';
                    });
                }
            });
        });
    