
        // Performance Monitoring — free, real-user load-time tracking,
        // viewable in Supabase Console → Build → Performance (no laptop
        // or devtools needed). Purely observational, doesn't touch any
        // existing logic or data.
        const rtdb = SBZLegacy.database();

        // ⏳ TOP LOADING BAR — shown while Supabase data is fetching
        function hideTopLoadingBar() {
            const bar = document.getElementById('topLoadingBar');
            if (bar) bar.classList.remove('active');
        }
        // Safety fallback: never let the bar spin forever if something goes wrong
        setTimeout(hideTopLoadingBar, 8000);

        // ⚡ INSTANT-PAINT CACHE — paints the last known maintenance/notification
        // state from localStorage the instant the page loads (no network wait),
        // then the live Supabase listener below silently corrects it if
        // anything changed. Pure perceived-speed win — RTDB structure/queries
        // are unchanged.
        const SC_CACHE_KEY = 'pz_site_config_cache_sy';
        (function paintCachedSiteConfig() {
            try {
                const cached = JSON.parse(localStorage.getItem(SC_CACHE_KEY) || 'null');
                if (!cached) return;
                if (cached.maintenance === true) {
                    document.getElementById('maintenanceOverlay').classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
                if (cached.notification) {
                    document.getElementById('notificationTickerText').innerHTML = cached.notification + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                }
            } catch (e) {}
        })();
        function saveSiteConfigToLS(partial) {
            try {
                const cached = JSON.parse(localStorage.getItem(SC_CACHE_KEY) || '{}');
                localStorage.setItem(SC_CACHE_KEY, JSON.stringify(Object.assign({}, cached, partial)));
            } catch (e) {}
        }

        // 🔧 MAINTENANCE MODE
        rtdb.ref('site_config/maintenance/sy').on('value', (snap) => {
            const overlay = document.getElementById('maintenanceOverlay');
            const isUnderMaintenance = snap.exists() && snap.val() === true;
            if (isUnderMaintenance) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            } else {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
            saveSiteConfigToLS({ maintenance: isUnderMaintenance });
        });

        // 📢 Notification Bar
        rtdb.ref('site_config/notification').on('value', (snap) => {
            const ticker = document.getElementById('notificationTickerText');
            if (snap.exists() && snap.val()) {
                ticker.innerHTML = snap.val() + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                saveSiteConfigToLS({ notification: snap.val() });
            } else {
                ticker.innerHTML = 'Welcome to studybuddypremiumpro! 🎓 Stay tuned for important updates. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                saveSiteConfigToLS({ notification: null });
            }
        });

        // Branch display names
        const branchDisplayNames = {
            civil: 'Civil Engg.', cs: 'Computer Science',
            aiml: 'AI/ML & AI/DS', entc: 'Electronics & Telecom',
            electrical: 'Electrical Engg.'
        };
        const branchFiles = {
            civil: 'SY-civil', cs: 'SY-cs',
            aiml: 'SY-aiml', entc: 'SY-entc',
            electrical: 'SY-electrical'
        };
        // ⚠️ यह module-type script block है — इसके अंदर की const/function दूसरे
        // plain script tag में दिखती नहीं (module scope global scope से अलग होता है)।
        // selectBranch() नीचे वाले plain script में है और इन्हें use करता है,
        // इसलिए window पर explicitly expose करना ज़रूरी है, वरना "branchFiles is not
        // defined" जैसा ReferenceError आता है (जो galat तरीके से "Network Error" दिखता है)।
        window.branchFiles = branchFiles;

        // 🔒 Capture original locked-state onclick for every card once, so we can re-lock later if branch changes
        document.querySelectorAll('.branch-card').forEach(card => {
            card.dataset.originalOnclick = card.getAttribute('onclick') || '';
        });

        function getCodeFromCard(card) {
            const match = (card.dataset.originalOnclick || '').match(/openLockSheet\([^,]+,[^,]+,'([^']+)'\)/);
            return match ? match[1] : null;
        }

        // 🔓 Unlock a branch card by removing locked class and lock overlay
        function unlockBranchCard(branchCode, branchFile) {
            document.querySelectorAll('.branch-card').forEach(card => {
                if (getCodeFromCard(card) !== branchCode) return;
                card.classList.remove('locked');
                const overlay = card.querySelector('.lock-overlay');
                if (overlay) overlay.remove();
                const linkEl = card.querySelector('.branch-card-link');
                if (linkEl) {
                    linkEl.innerHTML = '<i class="fa-solid fa-lock-open"></i> Open';
                    linkEl.style.color = '#10b981';
                    linkEl.style.background = 'rgba(16,185,129,0.1)';
                }
                card.setAttribute('href', branchFile);
                card.setAttribute('onclick', '');
            });
        }
        window.unlockBranchCard = unlockBranchCard;

        // 🔒 Re-lock a branch card (used when user switches their unlocked branch via a new payment)
        function lockBranchCard(branchCode) {
            document.querySelectorAll('.branch-card').forEach(card => {
                if (getCodeFromCard(card) !== branchCode) return;
                card.classList.add('locked');
                // ⚠️ unlockBranchCard() lock-overlay wale div ko DOM se .remove() kar deta hai.
                // Isliye re-lock karte waqt sirf class add karna kaafi nahi — icon/badge wapas
                // add karna zaroori hai, warna card locked to ho jaata hai (click blocked) par
                // lock icon screen par kabhi wapas nahi dikhta jab tak page reload na ho.
                if (!card.querySelector('.lock-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'lock-overlay';
                    overlay.innerHTML = '<i class="fa-solid fa-lock"></i><span class="lock-price-tag">Not Your Branch</span>';
                    card.prepend(overlay);
                }
                const linkEl = card.querySelector('.branch-card-link');
                if (linkEl) {
                    linkEl.innerHTML = '<i class="fa-solid fa-arrow-right"></i> ' + branchCode;
                    linkEl.style.color = '';
                    linkEl.style.background = '';
                }
                card.setAttribute('href', '#');
                card.setAttribute('onclick', card.dataset.originalOnclick);
            });
        }
        window.lockBranchCard = lockBranchCard;

        // 🎯 Student ने जो branch select की है सिर्फ वही branch card दिखे; बाकी छुप जाएँ
        // (जब तक वो branch change न करे)। Admin / branch-न-चुनी हो तो सभी cards दिखते हैं।
        function applyBranchVisibility(branch, isAdmin) {
            const mine = (!isAdmin && branch && branchFiles[branch]) ? branch : '';
            document.querySelectorAll('.branch-card').forEach(card => {
                const code = getCodeFromCard(card);
                card.style.display = (mine && code !== mine) ? 'none' : '';
            });
        }
        window.applyBranchVisibility = applyBranchVisibility;

        // 📝 MCQ → StudyBuddy Quiz module. Admin/host roles go straight to the
        // host dashboard to create/manage a quiz; everyone else goes to the
        // join page to enter a quiz code shared by their teacher.
        function openQuizModule() {
            if (window._userIsPremium) {
                window.location.href = 'quiz-host';
            } else {
                window.location.href = 'quiz-join';
            }
        }
        window.openQuizModule = openQuizModule;

        // 👤 AUTH — load user data, show profile, and unlock branch
        // ⚠️ IMPORTANT: 'users' node ची key म्हणजे Auth UID नाही, ती PRN आहे (Supabase स्क्रीनशॉट नुसार).
        // त्या PRN-keyed record च्या आत एक 'uid' field आहे जी Auth UID शी match होते.
        // म्हणून आधी uid वरून orderByChild('uid').equalTo(uid) करून योग्य PRN record शोधावी लागते.
        SBZLegacy.auth().onAuthStateChanged((user) => {
            if (!user) {
                if (window.AdminNotices && typeof window.AdminNotices.stop === 'function') window.AdminNotices.stop();
                if (typeof applyUserPhotoEverywhere === 'function') applyUserPhotoEverywhere(null);
                if (typeof hideMandatoryPhotoOverlay === 'function') hideMandatoryPhotoOverlay();
                if (typeof hideMandatorySidOverlay === 'function') hideMandatorySidOverlay();
                if (typeof hideAuthGateLoader === 'function') hideAuthGateLoader();
                hideTopLoadingBar();
                return;
            }
            const uid = user.uid;
            window._userEmail = user.email || '';
            window._userUid = uid;
            if (window.AdminNotices && typeof window.AdminNotices.start === 'function') window.AdminNotices.start();
            if (window.AdminNotices && typeof window.AdminNotices.maybeShowLoginPushPrompt === 'function') window.AdminNotices.maybeShowLoginPushPrompt(uid);

            // ✅ realtime (.on) — uid field match करणारा record शोधा (PRN की काहीही असो, uid नेहमी जुळेल)
            rtdb.ref('users').orderByChild('uid').equalTo(uid).on('value', (querySnap) => {
                if (!querySnap.exists()) {
                    console.warn('[StudyBuddy] uid="' + uid + '" साठी users मध्ये कोणताही record सापडला नाही. profiles table मधल्या त्या student च्या record मध्ये "uid" field बरोबर save आहे का ते तपासा.');
                    if (typeof applyUserPhotoEverywhere === 'function') applyUserPhotoEverywhere(null);
                    if (typeof hideMandatoryPhotoOverlay === 'function') hideMandatoryPhotoOverlay();
                    if (typeof hideMandatorySidOverlay === 'function') hideMandatorySidOverlay();
                    if (typeof hideAuthGateLoader === 'function') hideAuthGateLoader();
                    return;
                }

                let prn = null, data = null;
                querySnap.forEach(child => { prn = child.key; data = child.val(); });
                console.log('[StudyBuddy] PRN:', prn, '| profile data:', data);

                const name = data.name || data.displayName || (user.email ? user.email.split('@')[0] : 'Student');
                const registeredBranch = data.branch || data.selectedBranch || data.branchCode || data.Branch || '';

                // ✅ फक्त admin / super admin / master role असेल तरच सगळ्या branches unlock होतील.
                // gold / silver / diamond सारखे premium roles फक्त त्यांच्या स्वतःच्या unlocked branch पुरते मर्यादित राहतील.
                const roleStr = (data.role || '').toString().toLowerCase();
                const adminRoles = ['admin', 'superadmin', 'super admin', 'super-admin', 'master'];
                const isAdmin = adminRoles.includes(roleStr);
                const isPremium = isAdmin;

                window._userName = name;
                window._userRole = roleStr;
                window._userIsAdmin = isAdmin;
                window._userPrn = prn;
                window._userBranch = registeredBranch;
                window._userIsPremium = isPremium;
                window._userPhotoURL = data.photoURL || data.photo_url || null;
                window._userSid = data.sid || null;
                if (typeof applyUserPhotoEverywhere === 'function') applyUserPhotoEverywhere(window._userPhotoURL);
                if (typeof runMandatoryGates === 'function') runMandatoryGates(window._userPhotoURL, window._userSid);
                const sidDisplayEl = document.getElementById('profileSheetSid');
                if (sidDisplayEl) sidDisplayEl.textContent = window._userSid ? ('@' + window._userSid) : 'Not Set';
                // Keep Social Mode's Supabase profile aligned with whatever photo/SID is on file
                if (window._userPhotoURL) {
                    if (window.socialSyncToBackend) window.socialSyncToBackend({ photoURL: window._userPhotoURL });
                }
                if (window._userSid) {
                    if (window.socialSyncToBackend) window.socialSyncToBackend({ username: window._userSid });
                }

                // Header title stays as the static "StudyBuddyZone — SY" branding
                // (intentionally NOT synced to the logged-in user's name).

                // ── Update sidebar name & branch ──
                const menuName = document.getElementById('menuUserName');
                const menuRole = document.getElementById('menuUserRole');
                if (menuName) menuName.textContent = name;
                if (menuRole) menuRole.textContent = branchDisplayNames[registeredBranch] || (registeredBranch ? registeredBranch.toUpperCase() : 'SY');

                // ── Update Hello Card name ──
                const helloNameEl = document.getElementById('helloUserName');
                if (helloNameEl) { helloNameEl.textContent = name; helloNameEl.classList.remove('skeleton-loading'); }

                // ── Data has arrived: hide the top loading bar ──
                hideTopLoadingBar();

                console.log('[StudyBuddy] resolved branch:', registeredBranch || '(none)', '| role:', roleStr || '(none)', '| premium:', isPremium);

                // ── Unlock branches ──
                if (isPremium) {
                    // Admin / Super Admin / Master role: unlock ALL branches
                    Object.entries(branchFiles).forEach(([code, file]) => unlockBranchCard(code, file));
                } else {
                    // ✅ एका वेळी फक्त एकच branch unlock — registeredBranch हीच ती branch आहे.
                    // नवीन payment approve झाल्यावर ही value overwrite होते, म्हणजे आधीची branch आपोआप परत लॉक होते.
                    Object.entries(branchFiles).forEach(([code, file]) => {
                        if (registeredBranch && code === registeredBranch) {
                            unlockBranchCard(code, file);
                        } else {
                            lockBranchCard(code);
                        }
                    });
                }
                applyBranchVisibility(registeredBranch, isAdmin);
                if (typeof hideAuthGateLoader === 'function') hideAuthGateLoader();

                // ── 🎓 Branch selection popup — free, mandatory once, on first login ──
                // isAdmin ke liye popup nahi dikhana (unke liye sab branches already unlocked hain)
                if (!isAdmin && !registeredBranch) {
                    openBranchSelectSheet(true);
                } else {
                    closeBranchSelectSheet();
                }
            });
        });
    