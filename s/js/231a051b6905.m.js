
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

        // Question Bank now comes from the dashboard's Management system.
        window.openQuestionBank = function openQuestionBank() {
            openSubjectPicker('question-bank', [{"title": "General", "items": [{"name": "ENTC", "label": "ENTC — General"}]}, {"title": "Semester 3", "items": ["Engineering Mathematics-III", "Electronic Devices & Circuits", "Digital Electronics", "Employability & Skill Dev. / Innovation & Entrepreneurship", "Life of Chhatrapati Shivaji Maharaj", "Universal Human Values II"]}, {"title": "Semester 4", "items": ["Signals and Systems", "Microprocessors", "Network Theory", "Patents and IPR", "Life of Bharatratna Dr. Babasaheb Ambedkar"]}, {"title": "Semester 3 & 4 (common)", "items": ["Open Elective Bucket", "MDM Bucket"]}], 'ENTC Question Bank');
        }

        // ── BRANCH GUARD — this page belongs to ONLY this branch ──
        const THIS_PAGE_BRANCH = 'entc';
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

        // ── UNLOCK GOLD CARDS (Same Fifth / Same Sixth) ──
        // These cards redirect to their own pages (same-fifth-entc / same-sixth-entc);
        // unlocking here just removes the lock overlay so the tap goes through.
        function unlockGoldCards() {
            ['fifth','sixth'].forEach(id => {
                const lock = document.getElementById('lock-' + id);
                if (lock) lock.remove();
                const card = document.getElementById('card-' + id);
                if (card) card.classList.add('unlocked');
            });
            showToast('👑 Gold Unlocked', 'Same Fifth & Same Sixth are now accessible.', 'gold');
        }

        // ── UNLOCK DIAMOND CARDS (Notes / PIQs) ──
        // These cards redirect to their own pages (notes-entc / piqs-entc);
        // unlocking here just removes the lock overlay so the tap goes through.
        function unlockDiamondCards() {
            ['notes','piqs'].forEach(id => {
                const lock = document.getElementById('lock-' + id);
                if (lock) lock.remove();
                const card = document.getElementById('card-' + id);
                if (card) card.classList.add('unlocked');
            });
            showToast('💎 Diamond Unlocked', 'Notes & PIQs are now accessible.', 'diamond');
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

                // ✅ BRANCH GUARD — sirf apni selected branch ka hi content dikhna chahiye.
                const registeredBranch = (data.branch || data.selectedBranch || data.branchCode || data.Branch || '').toString().toLowerCase().trim();
                const roleForGuard = (data.role || '').toString().toLowerCase().trim();
                const adminRolesForGuard = ['admin','superadmin','super admin','super-admin','master'];
                const isAdminForGuard = adminRolesForGuard.includes(roleForGuard);
                if (!isAdminForGuard && registeredBranch !== THIS_PAGE_BRANCH) {
                    showBranchLockOverlay(registeredBranch);
                    return;
                }
                hideBranchLockOverlay();

                const name = data.name || data.displayName || (user.email ? user.email.split('@')[0] : 'Student');
                window._userName = name;

                // Role check — gold (case-insensitive)
                const roleStr = (data.role || '').toString().toLowerCase().trim();
                // Gold roles: 'gold' + 'diamond' (higher tier) + all admin/super roles also get access
                const goldRoles = ['gold','diamond','admin','superadmin','super admin','super-admin','master'];
                // Diamond roles: 'diamond' + all admin/super roles also get access
                const diamondRoles = ['diamond','admin','superadmin','super admin','super-admin','master'];
                const isGold = goldRoles.includes(roleStr);
                const isDiamond = diamondRoles.includes(roleStr);
                // Question Bank hierarchy: gold, diamond, admin, super admin unlock it.
                // student, guest, silver (or anything else) stay locked.
                const qbRoles = ['gold','diamond','admin','superadmin','super admin','super-admin','master'];
                const isQBUnlocked = qbRoles.includes(roleStr);

                // Update header & sidebar
                const menuName = document.getElementById('menuUserName');
                const menuRole = document.getElementById('menuUserRole');
                const headerTitle = document.getElementById('headerTitle');
                if (menuName) menuName.textContent = name;
                if (menuRole) {
                    if (isDiamond) { menuRole.textContent = '💎 Diamond'; menuRole.style.background = 'linear-gradient(135deg,#0891b2,#22d3ee)'; }
                    else if (isGold) { menuRole.textContent = '👑 Gold'; menuRole.style.background = 'linear-gradient(135deg,#d4a017,#f0b429)'; }
                    else { menuRole.textContent = roleStr.toUpperCase() || 'ENTC'; menuRole.style.background = ''; }
                }
                if (headerTitle) headerTitle.innerHTML = name + ' — <span>ENTC</span>';

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

                // Question Bank: unlock independently for gold/diamond/admin hierarchy
                const qbLock = document.getElementById('lock-qb');
                const qbCard = document.getElementById('card-qb');
                if (isQBUnlocked) {
                    if (qbLock) qbLock.remove();
                    if (qbCard) qbCard.classList.add('unlocked');
                }
                // else: stays locked by default — nothing to do

                // Same Fifth / Same Sixth — Gold tier
                if (isGold) {
                    unlockGoldCards();
                }
                // else: stays locked by default — nothing to do

                // Notes / PIQs — Diamond tier
                if (isDiamond) {
                    unlockDiamondCards();
                }
                // else: stays locked by default — nothing to do
            });
        });
    