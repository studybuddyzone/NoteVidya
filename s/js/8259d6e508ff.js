
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
        function sySetActiveNav(id) {
            document.querySelectorAll('#syBottomNav .sy-nav-btn').forEach(b => b.classList.remove('active'));
            const el = document.getElementById(id); if (el) el.classList.add('active');
        }
        function syNavHome() {
            sySetActiveNav('syNavHome');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        function syNavExplore() {
            sySetActiveNav('syNavExplore');
            const target = document.getElementById('exploreBranches') || document.querySelector('.quick-actions-row');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        function syNavSocial() {
            sySetActiveNav('syNavSocial');
            window.location.href = 'social-mode?year=sy';
        }
        function syNavNotifications() {
            sySetActiveNav('syNavNotifications');
            openAdminNoticesOverlay();
        }
        function syNavProfile() {
            sySetActiveNav('syNavProfile');
            if (typeof openProfileSheet === 'function') openProfileSheet();
        }

        // ══════════════════════════════════════
        // ADMIN NOTICES — bottom-nav bell (admin-only, NOT linked to Social Mode)
        // Reuses the polling/auth plumbing already running via window.AdminNotices
        // (exposed by the Social Mode script), but renders its own lightweight
        // vanilla panel so it works even if the user never opens Social Mode.
        // ══════════════════════════════════════
        const AN_ICON_FA = { general:'fa-bell', study:'fa-book-open', assignment:'fa-pen-nib', exam:'fa-graduation-cap', important:'fa-triangle-exclamation', event:'fa-calendar-days' };
        let anUnsubscribe = null;

        function anEscapeHtml(str) {
            return (str || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
        }

        function renderAdminNoticesPanel() {
            const body = document.getElementById('anPanelBody');
            if (!body) return;
            if (!window.AdminNotices) { body.innerHTML = '<div class="an-loading">Loading...</div>'; return; }
            const list = window.AdminNotices.getList() || [];
            if (list.length === 0) {
                body.innerHTML = '<div class="an-empty"><i class="fa-regular fa-bell-slash"></i>No notices yet. Admin updates will show up here.</div>';
                return;
            }
            body.innerHTML = list.map((n) => {
                const isUnread = !n.read;
                const icon = AN_ICON_FA[n.type] || 'fa-bell';
                const timeStr = (window.AdminNotices.timeAgo ? window.AdminNotices.timeAgo(n.created_at) : '') || '';
                const action = n.actionUrl
                    ? `<a href="${sbzUrl(n.actionUrl)}" class="an-item-action" onclick="event.stopPropagation(); markAdminNoticeReadAndRefresh('${n.id}');">${anEscapeHtml(n.actionText || 'View')} →</a>`
                    : '';
                let attach = '';
                if (n.attachmentType === 'link' && n.attachmentUrl) {
                    attach = `<a href="${sbzUrl(n.attachmentUrl)}" rel="noopener" class="an-item-action" onclick="event.stopPropagation();"><i class="fa-solid fa-link"></i> Open Link</a>`;
                } else if (n.attachmentType === 'image' && n.attachmentUrl) {
                    attach = `<img src="${sbzUrl(n.attachmentUrl)}" onclick="event.stopPropagation();window.open('${anEscapeHtml(n.attachmentUrl)}','_blank')" style="display:block;max-width:100%;max-height:160px;border-radius:8px;margin-top:6px;cursor:pointer;object-fit:cover;"  loading="lazy" decoding="async" alt=""/>`;
                } else if (n.attachmentType === 'pdf' && n.attachmentUrl) {
                    // Opens in-page via pdf-viewer-modal.js — the app's WebView
                    // was silently blocking page-to-page navigation, so this
                    // never navigates anywhere; it renders as an overlay instead.
                    attach = `<a href="javascript:void(0)" data-pdf-url="${anEscapeHtml(n.attachmentUrl)}" data-pdf-name="${anEscapeHtml(n.attachmentName || 'Notice PDF')}" class="an-item-action" onclick="event.stopPropagation();openPdfViewer(this.dataset.pdfUrl, this.dataset.pdfName)"><i class="fa-solid fa-file-pdf"></i> View PDF${n.attachmentName ? (' — ' + anEscapeHtml(n.attachmentName)) : ''}</a>`;
                }
                return `<div class="an-item${isUnread ? ' unread' : ''}" onclick="markAdminNoticeReadAndRefresh('${n.id}')">
                    <div class="an-item-icon"><i class="fa-solid ${icon}"></i></div>
                    <div style="flex:1;min-width:0;">
                        <p class="an-item-title">${anEscapeHtml(n.title || '')}${isUnread ? '<span class="an-new-tag">• NEW</span>' : ''}</p>
                        <p class="an-item-msg">${anEscapeHtml(n.message || '')}</p>
                        <p class="an-item-time">${timeStr}</p>
                        ${attach}
                        ${action}
                    </div>
                </div>`;
            }).join('');
        }

        function markAdminNoticeReadAndRefresh(id) {
            if (!window.AdminNotices) return;
            window.AdminNotices.markRead(id);
            setTimeout(renderAdminNoticesPanel, 400);
        }

        function markAllAdminNoticesRead() {
            if (!window.AdminNotices) return;
            window.AdminNotices.markAllRead();
            setTimeout(renderAdminNoticesPanel, 400);
        }

        function updateAdminNoticeBadge() {
            const dot = document.getElementById('anBadgeDot');
            if (!dot || !window.AdminNotices) return;
            const unread = window.AdminNotices.getUnreadCount();
            dot.classList.toggle('show', unread > 0);
        }

        function openAdminNoticesOverlay() {
            const backdrop = document.getElementById('anOverlayBackdrop');
            const panel = document.getElementById('anPanel');
            if (!backdrop || !panel) return;
            backdrop.classList.add('active');
            panel.classList.add('active');

            let signedIn = false;
            try { signedIn = !!(window.SBZLegacy.auth().currentUser); } catch (err) { signedIn = false; }

            if (!signedIn) {
                document.getElementById('anPanelBody').innerHTML = '<div class="an-empty"><i class="fa-solid fa-lock"></i>Please sign in to view admin notices.</div>';
                return;
            }
            if (window.AdminNotices) {
                renderAdminNoticesPanel();
                window.AdminNotices.refresh().then(renderAdminNoticesPanel);
                if (!anUnsubscribe) anUnsubscribe = window.AdminNotices.subscribe(() => {
                    renderAdminNoticesPanel();
                    updateAdminNoticeBadge();
                });
            } else {
                document.getElementById('anPanelBody').innerHTML = '<div class="an-loading">Loading...</div>';
            }
        }

        function closeAdminNoticesOverlay() {
            const backdrop = document.getElementById('anOverlayBackdrop');
            const panel = document.getElementById('anPanel');
            if (backdrop) backdrop.classList.remove('active');
            if (panel) panel.classList.remove('active');
        }

        // Keep the bell badge in sync even before the panel is ever opened
        (function anWatchForReadyState() {
            const iv = setInterval(() => {
                if (window.AdminNotices) {
                    clearInterval(iv);
                    updateAdminNoticeBadge();
                    window.AdminNotices.subscribe(updateAdminNoticeBadge);
                }
            }, 500);
        })();

        function openSidebar() { document.getElementById('mySidebar').classList.add('active'); document.getElementById('sidebarOverlay').style.display = 'block'; document.body.style.overflow = 'hidden'; }
        function closeSidebar() { document.getElementById('mySidebar').classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; document.body.style.overflow = ''; }

        function handleLogout() {
            closeSidebar();
            SBZLegacy.auth().signOut().then(() => {
                showPremiumNotification("Logged Out", "आप successfully logout हो गए हैं। 👋", false);
                setTimeout(() => { window.location.href = "/"; }, 1200);
            }).catch(() => {
                showPremiumNotification("Error", "Logout failed. Please try again.", true);
            });
        }

        // 👤 PROFILE SHEET
        function openProfileSheet() {
            const name = window._userName || 'Student';
            const email = window._userEmail || '';
            const branch = window._userBranch || '';
            const isPremium = window._userIsPremium || false;
            const branchDisplayNames = {
                civil: 'Civil Engg.', mech: 'Mechanical Engg.', cs: 'Computer Science',
                aiml: 'AI & ML', entc: 'Electronics & Telecom', it: 'Information Technology',
                electrical: 'Electrical Engg.', chem: 'Chemical Engg.',
                petro: 'Petrochemical Engg.', prod: 'Production Engg.'
            };
            const branchLabel = branchDisplayNames[branch] || branch.toUpperCase() || '—';
            document.getElementById('profileSheetName').textContent = name;
            document.getElementById('profileSheetEmail').textContent = email || '—';
            document.getElementById('profileSheetBranchInfo').textContent = branchLabel;
            const branchBadge = document.getElementById('profileSheetBranch');
            if (branch) { branchBadge.textContent = branchLabel; branchBadge.style.display = 'inline-block'; }
            document.getElementById('profileSheetPremiumBadge').style.display = isPremium ? 'inline-block' : 'none';
            document.getElementById('profileSheetFreeBadge').style.display = isPremium ? 'none' : 'inline-block';
            document.getElementById('profileSheetBackdrop').classList.add('open');
            document.getElementById('profileSheet').classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeProfileSheet() {
            document.getElementById('profileSheetBackdrop').classList.remove('open');
            document.getElementById('profileSheet').classList.remove('open');
            document.body.style.overflow = '';
        }

        // 🔒 "NOT YOUR BRANCH" INFO SHEET (informational only — branch selection is free, no payment here)
        function openLockSheet(branchName, branchFile, branchCode) {
            document.getElementById('lockSheetBranch').textContent = branchName;
            const myBranch = window._userBranch || '';
            document.getElementById('lockSheetMyBranch').textContent = myBranch ? (branchDisplayNamesGlobalSafe(myBranch)) : 'अभी तक select नहीं की';
            document.getElementById('lockBackdrop').classList.add('open');
            document.getElementById('lockSheet').classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeLockSheet() {
            document.getElementById('lockBackdrop').classList.remove('open');
            document.getElementById('lockSheet').classList.remove('open');
            document.body.style.overflow = '';
        }
        function branchDisplayNamesGlobalSafe(code) {
            const map = { civil:'Civil Engg.', cs:'Computer Science', aiml:'AI/ML & AI/DS', entc:'Electronics & Telecom', electrical:'Electrical Engg.' };
            return map[code] || code.toUpperCase();
        }

        // 🎓 FREE BRANCH-SELECTION POPUP
        // mandatory=true -> shown automatically because user has no branch yet (no close button, can't dismiss)
        // mandatory=false -> user opened it voluntarily to change their branch (close button shown)
        function openBranchSelectSheet(mandatory) {
            const sheet = document.getElementById('branchSelectSheet');
            const backdrop = document.getElementById('branchSelectBackdrop');
            sheet.classList.toggle('mandatory', !!mandatory);
            backdrop.onclick = mandatory ? null : closeBranchSelectSheet;
            backdrop.classList.add('open');
            sheet.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeBranchSelectSheet() {
            const sheet = document.getElementById('branchSelectSheet');
            if (!sheet.classList.contains('open')) return;
            document.getElementById('branchSelectBackdrop').classList.remove('open');
            sheet.classList.remove('open');
            document.body.style.overflow = '';
        }

        // Branch selection goes entirely through the backend API (free, single Vercel function)
        function selectBranch(branchCode, branchName) {
            const uid = window._userUid || (SBZLegacy.auth().currentUser && SBZLegacy.auth().currentUser.uid);
            if (!uid) { showPremiumNotification('Error', 'कृपया दोबारा login करें।', true); return; }

            document.querySelectorAll('#bsOptionsList .bs-option').forEach(b => b.disabled = true);

            fetch('https://studybuddypro-psi.vercel.app/api/backend?action=select-branch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: uid, prn: window._userPrn || '', branch: branchCode })
            })
            .then(r => r.json())
            .then((result) => {
                document.querySelectorAll('#bsOptionsList .bs-option').forEach(b => b.disabled = false);
                if (!result || !result.success) {
                    showPremiumNotification('Error', (result && result.error) || 'Branch select नहीं हो पाई, फिर try करें।', true);
                    return;
                }
                // ✅ Update UI immediately — no page reload needed
                window._userBranch = branchCode;
                Object.entries(branchFiles).forEach(([code, file]) => {
                    if (code === branchCode) unlockBranchCard(code, file); else lockBranchCard(code);
                });
                applyBranchVisibility(branchCode, !!window._userIsAdmin);
                const menuRole = document.getElementById('menuUserRole');
                if (menuRole) menuRole.textContent = branchDisplayNamesGlobalSafe(branchCode);
                closeBranchSelectSheet();
                showPremiumNotification('Branch Selected! 🎓', branchName + ' unlock हो गई।', false);
            })
            .catch((err) => {
                document.querySelectorAll('#bsOptionsList .bs-option').forEach(b => b.disabled = false);
                showPremiumNotification('Network Error', err.message, true);
            });
        }

        // ── Hidden debug console (temporary) ──────────────────────────────
        // Not a visible button anywhere. Tapping the existing "Settings"
        // sidebar item normally does nothing new (still shows the usual
        // "Coming Soon" message). Only 5 quick taps within 2.5s on that
        // same item opens a read-only-ish console (view logs/errors/
        // localStorage — no page/DOM editing) for debugging. Remove this
        // whole block + the id on the Settings link once debugging is done.
        let __sbTapCount = 0, __sbTapTimer = null;
        function handleSettingsMenuTap() {
            __sbTapCount++;
            if (__sbTapTimer) clearTimeout(__sbTapTimer);
            __sbTapTimer = setTimeout(() => { __sbTapCount = 0; }, 2500);
            if (__sbTapCount >= 5) {
                __sbTapCount = 0;
                openHiddenDebugConsole();
                return;
            }
            showPremiumNotification('Coming Soon', 'This section will be available soon!', false);
        }
        function openHiddenDebugConsole() {
            if (window.eruda && window.eruda._isInit) { window.eruda.show(); return; }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/eruda';
            s.onload = function () {
                window.eruda.init({ tool: ['console', 'resources'] }); // no "elements" (DOM editor) — view-only
                window.eruda.show();
            };
            document.body.appendChild(s);
        }

        // ── 🥈 Question Bank (Silver+) / 👑 Answer Bank (Gold+) ─────────────────────
        // Subject lists + tier rules live in sy-resources.js (shared with SY-aiml / SY-cs / SY-entc).
                function openTierSheet(key) {
            const sec = window.SY_RESOURCES && window.SY_RESOURCES.SECTIONS[key];
            if (!sec) return;
            const isGold = sec.tier === 'gold';
            const sheet = document.getElementById('tierSheet');
            sheet.classList.remove('tier-silver', 'tier-gold');
            sheet.classList.add(isGold ? 'tier-gold' : 'tier-silver');
            const ico = isGold ? 'fa-crown' : 'fa-medal';
            document.getElementById('tierSheetIcon').className = 'fa-solid ' + ico;
            document.getElementById('tierSheetBtnIcon').className = 'fa-solid ' + ico;
            document.getElementById('tierSheetTitle').textContent = isGold ? 'Gold Membership Required 👑' : 'Silver Membership Required 🥈';
            document.getElementById('tierSheetSection').textContent = sec.label;
            document.getElementById('tierSheetDesc').innerHTML = isGold
                ? '<strong>' + sec.label + '</strong> Gold (और Diamond) members के लिए unlock है।<br>Gold membership लेकर semester-wise ' + sec.label + ' access करें।'
                : '<strong>' + sec.label + '</strong> Silver (और Gold / Diamond) members के लिए unlock है।<br>Silver membership लेकर semester-wise ' + sec.label + ' access करें।';
            document.getElementById('tierSheetBtnText').textContent = isGold ? 'Get Gold Membership' : 'Get Silver Membership';
            const b = (window._userBranch || '').toString().toLowerCase();
            document.getElementById('tierSheetBtn').setAttribute('href', 'premium-get?plan=' + sec.tier + (b ? '&branch=' + encodeURIComponent(b) : ''));
            document.getElementById('tierBackdrop').classList.add('open');
            sheet.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeTierSheet() {
            document.getElementById('tierBackdrop').classList.remove('open');
            document.getElementById('tierSheet').classList.remove('open');
            document.body.style.overflow = '';
        }
        function closeSYBranchChooser() {
            document.getElementById('syBranchBackdrop').classList.remove('open');
            document.getElementById('syBranchSheet').classList.remove('open');
            document.body.style.overflow = '';
        }
        function openSYBranchChooser(key) {
            const R = window.SY_RESOURCES;
            document.getElementById('syBranchChooserDesc').textContent = R.SECTIONS[key].label + ' — किस branch का देखना है?';
            document.getElementById('syBranchChooserButtons').innerHTML = Object.keys(R.BRANCHES).map(function (code) {
                return '<button class="lock-sheet-btn-secondary" onclick="closeSYBranchChooser(); openSYSectionForBranch(\'' + key + '\', \'' + code + '\')">' + R.BRANCHES[code].title + '</button>';
            }).join('');
            document.getElementById('syBranchBackdrop').classList.add('open');
            document.getElementById('syBranchSheet').classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function openSYSectionForBranch(key, branch) {
            const R = window.SY_RESOURCES;
            const b = R.normBranch(branch);
            if (b) {
                if (key === 'questionBank') R.openQuestionBank(b);
                else if (key === 'pyq') R.openPYQ(b);
                else if (key === 'notes') R.openNotes(b);
                else R.openAnswerBank(b);
                return;
            }
            // Branch पहले से select है तो दोबारा branch कभी नहीं पूछते।
            // सिर्फ तब जब profile में branch बिल्कुल set नहीं है: admin को chooser, student को branch-select sheet।
            if (!(branch || '').toString().trim()) {
                if (window._userIsAdmin) { openSYBranchChooser(key); return; }
                openBranchSelectSheet(false);
                return;
            }
            showPremiumNotification('Coming Soon', 'आपकी branch का ' + R.SECTIONS[key].label + ' जल्द आएगा!', false);
        }
        // 🎬 DEMO — free sample files of the user's own branch (admin uploads them with category '<section>-demo').
        function openSYDemo(key) {
            const R = window.SY_RESOURCES;
            if (!R || typeof window.openDemoList !== 'function') {
                showPremiumNotification('Error', 'Page पूरी तरह load नहीं हुआ। Reload करके फिर try करें।', true);
                return;
            }
            const b = R.normBranch(window._userBranch);
            if (!b) {
                if (window._userIsAdmin) { showPremiumNotification('Demo', 'Admin: demo देखने के लिए पहले अपनी branch select करें।', false); return; }
                openBranchSelectSheet(false);
                return;
            }
            R.openDemo(key, b, 'all');
        }
        function openSYSection(key) {
            if (!window.SY_RESOURCES || typeof window.openSubjectPicker !== 'function') {
                showPremiumNotification('Error', 'Page पूरी तरह load नहीं हुआ। Reload करके फिर try करें।', true);
                return;
            }
            if (typeof window._userRole === 'undefined') {
                showPremiumNotification('Please wait', 'Profile load हो रही है, कुछ सेकंड बाद फिर tap करें।', false);
                return;
            }
            if (!window.SY_RESOURCES.roleHasAccess(window._userRole, key)) { openTierSheet(key); return; }
            openSYSectionForBranch(key, window._userBranch);
        }

        function showPremiumNotification(title, message, isError) {
            const toast = document.getElementById('universalPremiumToast');
            const icon = document.getElementById('toastIconElement');
            document.getElementById('toastHeaderTitle').innerText = title;
            document.getElementById('toastMessageText').innerText = message;
            if (isError) { toast.className = 'premium-toast toast-error active'; icon.className = 'fa-solid fa-triangle-exclamation'; }
            else { toast.className = 'premium-toast toast-success active'; icon.className = 'fa-solid fa-circle-check'; }
            setTimeout(() => { toast.classList.remove('active'); }, 2500);
        }
    