
        
        // Performance Monitoring — free, real-user load-time tracking,
        // viewable in Supabase Console → Build → Performance (no laptop
        // or devtools needed). Purely observational, doesn't touch any
        // existing logic or data.

        const auth = SBZLegacy.auth();
        const rtdb = SBZLegacy.database();

        // ⚡ INSTANT-PAINT CACHE — the maintenance banner and notification
        // ticker used to stay blank/default until the Supabase round-trip
        // finished on every single visit. Now we paint the last known
        // value from localStorage the moment the page loads (no network
        // wait), then the live Supabase listener below silently corrects
        // it if anything changed. Pure perceived-speed win — the RTDB
        // structure and query itself are unchanged.
        const SC_CACHE_KEY = 'pz_site_config_cache_fy';
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

        // 🔧 MAINTENANCE MODE — Realtime Supabase Listener
        rtdb.ref('site_config/maintenance/fy').on('value', (snap) => {
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

        // 📢 Notification Bar - Realtime Supabase Sync
        rtdb.ref('site_config/notification').on('value', (snap) => {
            const ticker = document.getElementById('notificationTickerText');
            if (snap.exists() && snap.val()) {
                ticker.innerHTML = snap.val() + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                saveSiteConfigToLS({ notification: snap.val() });
            } else {
                ticker.innerHTML = 'Welcome to Study Buddy Pro! 🎓 Stay tuned for important updates. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                saveSiteConfigToLS({ notification: null });
            }
        });

        let currentUserUid = null;
        let currentUserRole = "blank"; 
        let currentUserEmail = "";
        let currentUserName = "Student User";
        let currentUserPhotoURL = null;
        let currentUserSid = null;
        let masterWelcomeSoundPlayed = false;
        let expiryCheckInterval = null;

        // ===== LOCAL STORAGE HELPERS =====
        const LS_KEY = "pz_user_cache";
        function saveUserToLS(uid, email, name, role) {
            try {
                localStorage.setItem(LS_KEY, JSON.stringify({ uid, email, name, role, savedAt: Date.now() }));
            } catch(e) {}
        }
        function getUserFromLS() {
            try {
                const raw = localStorage.getItem(LS_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch(e) { return null; }
        }
        function clearUserFromLS() {
            try { localStorage.removeItem(LS_KEY); } catch(e) {}
        }

        // ===== EXPIRY CHECK via RTDB =====
        function checkPremiumExpiry(uid) {
            if (!uid) return;
            const premiumRoles = ["gold","diamond","silver"];
            if (!premiumRoles.includes(currentUserRole)) return;
            rtdb.ref('premium').orderByChild('uid').equalTo(uid).once('value').then((snap) => {
                if (!snap.exists()) return;
                const key = Object.keys(snap.val())[0];
                const planData = snap.val()[key];
                const expiry = planData.expiryDate || planData.expiry_date || planData.endDate || planData.expiresOn || planData.expiry;
                if (!expiry) return;
                const expiryMs = typeof expiry === "number" ? expiry : (!isNaN(expiry) ? parseInt(expiry) : new Date(expiry).getTime());
                if (Date.now() > expiryMs) {
                    document.getElementById('renewalBanner').classList.add('show');
                }
            }).catch((e) => { console.warn("Expiry check error:", e); });
        }

        function startExpiryPolling(uid) {
            if (expiryCheckInterval) clearInterval(expiryCheckInterval);
            checkPremiumExpiry(uid); // immediate first check
            expiryCheckInterval = setInterval(() => {
                checkPremiumExpiry(uid);
            }, 5 * 60 * 1000); // every 5 minutes
        }

        // ===== LOGOUT =====
        function handleLogout() {
            closeSidebar();
            auth.signOut().then(() => {
                clearUserFromLS();
                if (expiryCheckInterval) clearInterval(expiryCheckInterval);
                showPremiumNotification("Logged Out", "आप successfully logout हो गए हैं। 👋", false);
                setTimeout(() => { window.location.href = "/"; }, 1200);
            }).catch((e) => {
                showPremiumNotification("Error", "Logout failed. Please try again.", true);
            });
        }

        auth.onAuthStateChanged((user) => {
            const namePlaceholder = document.getElementById('menuUserName');
            const rolePlaceholder = document.getElementById('menuUserRole');
            const lockBtn = document.getElementById('adminLockBtn');
            
            lockBtn.classList.remove('vip-master-active');
            rolePlaceholder.classList.remove('vip-master-active');
            lockBtn.style.background = "";
            lockBtn.style.color = "";
            lockBtn.style.borderColor = "";

            if (user) {
                currentUserUid = user.uid;
                // ⚠️ Notices / push prompt me koi bhi error aaye to profile sync (neeche wala users listener) kabhi nahi rukna chahiye.
                try { startAdminNoticeListeners(); } catch (e) { console.warn('startAdminNoticeListeners failed:', e); }
                try { maybeShowLoginPushPrompt(user.uid); } catch (e) { console.warn('maybeShowLoginPushPrompt failed:', e); }
                currentUserEmail = user.email;
                const soloHook = document.getElementById('soloIdentityHook');
                if (soloHook) soloHook.innerText = currentUserEmail;
                
                rtdb.ref('users').orderByChild('uid').equalTo(user.uid).on('value', (snapshot) => {
                    if (snapshot.exists()) {
                        const key = Object.keys(snapshot.val())[0];
                        const userData = snapshot.val()[key];
                        
                        currentUserRole = userData.role ? userData.role.trim().toLowerCase() : "student";
                        currentUserName = userData.name || user.email.split('@')[0];
                        window.currentUserName = currentUserName; // expose real Supabase name so Social Mode never falls back to email
                        rolePlaceholder.innerText = currentUserRole.toUpperCase();
                        
                        // Save to localStorage (RTDB remains authoritative)
                        saveUserToLS(user.uid, user.email, currentUserName, currentUserRole);
                        // Start periodic expiry check every 5 min
                        startExpiryPolling(user.uid);
                        
                        if (currentUserRole === "master") {
                            rolePlaceholder.innerText = "👑 MASTER VIP";
                            rolePlaceholder.style.background = "#000000";
                            rolePlaceholder.style.color = "#f59e0b";
                            rolePlaceholder.classList.add('vip-master-active');
                            lockBtn.style.color = "#f59e0b";
                            lockBtn.style.borderColor = "#f59e0b";
                            lockBtn.classList.add('vip-master-active');
                            if (!masterWelcomeSoundPlayed) {
                                setTimeout(() => { playMasterWelcomeVoice(); masterWelcomeSoundPlayed = true; }, 800);
                            }
                        } else if (currentUserRole === "superadmin") {
                            lockBtn.style.color = "#e11d48"; lockBtn.style.borderColor = "rgba(225, 29, 72, 0.4)";
                            rolePlaceholder.style.background = "#e11d48"; rolePlaceholder.style.color = "#ffffff";
                        } else if (currentUserRole === "admin") {
                            lockBtn.style.color = "#a855f7"; lockBtn.style.borderColor = "rgba(168, 85, 247, 0.4)";
                            rolePlaceholder.style.background = "#a855f7"; rolePlaceholder.style.color = "#ffffff";
                        } else if (currentUserRole === "moderator") {
                            lockBtn.style.color = "#06b6d4"; lockBtn.style.borderColor = "rgba(6, 182, 212, 0.4)";
                            rolePlaceholder.style.background = "#06b6d4"; rolePlaceholder.style.color = "#ffffff";
                        } else if (currentUserRole === "diamond") {
                            lockBtn.style.color = "#ec4899"; lockBtn.style.borderColor = "rgba(236, 72, 153, 0.4)";
                            rolePlaceholder.style.background = "#ec4899"; rolePlaceholder.style.color = "#ffffff";
                        } else if (currentUserRole === "gold") {
                            lockBtn.style.color = "#4f46e5"; lockBtn.style.borderColor = "rgba(79, 70, 229, 0.4)";
                            rolePlaceholder.style.background = "#4f46e5"; rolePlaceholder.style.color = "#ffffff";
                        } else if (currentUserRole === "silver") {
                            lockBtn.style.color = "#f59e0b"; lockBtn.style.borderColor = "rgba(245, 158, 11, 0.4)";
                            rolePlaceholder.style.background = "#f59e0b"; rolePlaceholder.style.color = "#ffffff";
                        } else {
                            rolePlaceholder.innerText = "STUDENT";
                            lockBtn.style.color = "#64748b"; lockBtn.style.borderColor = "rgba(0, 0, 0, 0.08)";
                            rolePlaceholder.style.background = "#64748b"; rolePlaceholder.style.color = "#ffffff";
                        }

                        namePlaceholder.innerText = currentUserName;
                        document.getElementById('profName').innerText = currentUserName;
                        document.getElementById('profEmail').innerText = userData.email || user.email || "N/A";
                        document.getElementById('profMobile').innerText = userData.mobile || "Not Linked";
                        applyUserPhotoEverywhere(userData.photoURL || userData.photo_url || null);
                        currentUserSid = userData.sid || null;
                        window.currentUserSid = currentUserSid;
                        const profSidEl = document.getElementById('profSid');
                        if (profSidEl) profSidEl.innerText = currentUserSid ? ('@' + currentUserSid) : 'Not Set';
                        runMandatoryGates(userData.photoURL || userData.photo_url || null, currentUserSid);
                        if (typeof refreshNotificationBadge === 'function') refreshNotificationBadge();
                        // Keep Social Mode's Supabase profile aligned with whatever photo is on file
                        if (userData.photoURL || userData.photo_url) {
                            if (window.socialSyncToBackend) window.socialSyncToBackend({ photoURL: userData.photoURL || userData.photo_url });
                        }
                        // Same for the S ID — existing users who set their SID before Social Mode
                        // existed would otherwise never get a `username` row in Supabase, making
                        // them unsearchable by SID forever.
                        if (currentUserSid) {
                            if (window.socialSyncToBackend) window.socialSyncToBackend({ username: currentUserSid });
                        }
                        applyAccessLocks();
                        fetchPremiumSubscriptionDetails(user.uid, currentUserRole);
                        hideAuthGateLoader();
                    } else {
                        namePlaceholder.innerText = user.email.split('@')[0];
                        rolePlaceholder.innerText = "STUDENT";
                        rolePlaceholder.style.background = "#64748b";
                        fallbackProfileDetails(user.email);
                        currentUserRole = "student";
                        applyUserPhotoEverywhere(null);
                        currentUserSid = null;
                        runMandatoryGates(null, null);
                        applyAccessLocks();
                        showDashPremiumFields("student");
                        hideAuthGateLoader();
                    }
                }, (error) => {
                    console.error("Realtime sync issue:", error);
                    hideAuthGateLoader();
                });

            } else {
                currentUserUid = null; currentUserRole = "blank"; currentUserEmail = "";
                stopAdminNoticeListeners();
                clearUserFromLS();
                if (expiryCheckInterval) clearInterval(expiryCheckInterval);
                namePlaceholder.innerText = "Study Buddy Pro Guest";
                rolePlaceholder.innerText = "GUEST";
                rolePlaceholder.style.background = "#64748b";
                fallbackProfileDetails("Guest Mode Active");
                document.getElementById('soloIdentityHook').innerText = "Guest Terminal (Sign In Required)";
                applyUserPhotoEverywhere(null);
                hideMandatoryPhotoOverlay();
                hideMandatorySidOverlay();
                applyAccessLocks();
                hideAuthGateLoader();
            }
        });

        function applyAccessLocks() {
            document.querySelectorAll('[data-access]').forEach((box) => {
                const allowedRoles = box.getAttribute('data-access').split(',').map(r => r.trim());
                if (allowedRoles.includes(currentUserRole)) {
                    box.classList.remove('vip-locked-box');
                } else {
                    box.classList.add('vip-locked-box');
                }
            });
        }

        function checkRestrictedAccess(box) {
            const allowedRoles = box.getAttribute('data-access').split(',').map(r => r.trim());
            const target = box.getAttribute('data-target');
            if (allowedRoles.includes(currentUserRole)) {
                window.location.href = target;
            } else {
                const titleAttr = box.getAttribute('data-title');
                const titleEl = box.querySelector('.box-info-text h4, .rli-text h4, .dc-title, .igc-title');
                const subjectName = titleAttr ? titleAttr.trim() : (titleEl ? titleEl.innerText.trim() : 'This subject');
                openUpgradePromptModal(subjectName);
            }
        }

        function openUpgradePromptModal(subjectName) {
            const isPyq = subjectName.toLowerCase().includes('pyq');
            const isNotes = subjectName.toLowerCase().includes('handwritten');
            let msg;
            if (isPyq) {
                msg = `"${subjectName}" Gold members और उससे ऊपर के लिए available है। अपना plan upgrade करें।`;
            } else if (isNotes) {
                msg = `"${subjectName}" Gold members और उससे ऊपर के लिए available है। अपना plan upgrade करें।`;
            } else {
                msg = `"${subjectName}" is available for Gold members and above. Upgrade your plan to unlock it.`;
            }
            document.getElementById('upgradePromptSubject').innerText = msg;
            document.getElementById('upgradePromptModal').classList.add('active');
        }

        function closeUpgradePromptModal() {
            document.getElementById('upgradePromptModal').classList.remove('active');
        }

        function fallbackProfileDetails(email) {
            document.getElementById('profName').innerText = "Guest Student";
            document.getElementById('profEmail').innerText = email;
            document.getElementById('profMobile').innerText = "N/A";
            showDashPremiumFields("guest");
        }

        function showDashPremiumFields(role) {
            document.getElementById('profPlanRole').innerText = role ? role.toUpperCase() : "-";
            document.getElementById('profActivationDate').innerText = "-";
            document.getElementById('profExpiryDate').innerText = "-";
            document.getElementById('profPremiumStack').style.display = "flex";
        }

        function formatPremiumDate(value) {
            if (!value) return "N/A";
            let d;
            if (typeof value === "number") { d = new Date(value); }
            else if (!isNaN(value) && value.toString().length >= 10) { d = new Date(parseInt(value)); }
            else { d = new Date(value); }
            if (isNaN(d.getTime())) return value.toString();
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        function fetchPremiumSubscriptionDetails(uid, role) {
            const stack = document.getElementById('profPremiumStack');
            const planEl = document.getElementById('profPlanRole');
            const activationEl = document.getElementById('profActivationDate');
            const expiryEl = document.getElementById('profExpiryDate');

            const premiumRoles = ["gold", "diamond", "silver"];
            if (!premiumRoles.includes(role)) {
                showDashPremiumFields(role);
                return;
            }

            rtdb.ref('premium').orderByChild('uid').equalTo(uid).once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const key = Object.keys(snapshot.val())[0];
                    const planData = snapshot.val()[key];
                    const activation = planData.activationDate || planData.activation_date || planData.startDate || planData.activatedOn || planData.activation;
                    const expiry = planData.expiryDate || planData.expiry_date || planData.endDate || planData.expiresOn || planData.expiry;
                    planEl.innerText = (planData.plan || role).toString().toUpperCase();
                    activationEl.innerText = activation ? formatPremiumDate(activation) : "-";
                    expiryEl.innerText = expiry ? formatPremiumDate(expiry) : "-";
                    stack.style.display = "flex";
                } else {
                    planEl.innerText = role.toUpperCase();
                    activationEl.innerText = "-";
                    expiryEl.innerText = "-";
                    stack.style.display = "flex";
                }
            }).catch((error) => {
                console.error("Premium fetch error:", error);
                showDashPremiumFields(role);
            });
        }

        window.checkMasterRoleAccess = function() {
            if (!currentUserUid) { triggerStudentWarningEffect(document.getElementById('adminLockBtn')); return; }
            const passwordRequiredRoles = ["superadmin", "admin", "moderator", "diamond", "gold", "silver"];
            if (currentUserRole === "master") {
                // Redirect se theek pehle backend se dobara confirm hota hai (defense-in-depth) —
                // master khud bhi apni taraf se yeh verify karega, yeh sirf ek extra layer hai.
                fetch('https://studybuddypro-psi.vercel.app/api/backend?action=verify-prn', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: currentUserUid, mode: 'login' })
                })
                .then(r => r.json())
                .then((result) => {
                    if (result && result.found && result.role === 'master') {
                        showPremiumNotification("👑 VIP Access Granted", "Launching master console workspace...", false);
                        playMasterWelcomeVoice();
                        setTimeout(() => { window.open("master?adminUid=" + encodeURIComponent(currentUserUid), "_blank"); }, 1200);
                    } else {
                        triggerStudentWarningEffect(document.getElementById('adminLockBtn'));
                    }
                })
                .catch(() => { triggerStudentWarningEffect(document.getElementById('adminLockBtn')); });
            } else if (passwordRequiredRoles.includes(currentUserRole)) {
                document.getElementById('gatePassField').value = "";
                document.getElementById('secureGateModal').classList.add('active');
            } else {
                triggerStudentWarningEffect(document.getElementById('adminLockBtn'));
            }
        };

        window.verifyGatePassword = function() {
            const passwordField = document.getElementById('gatePassField');
            const submitBtn = document.getElementById('gateSubmitBtn');
            const enteredPassword = passwordField.value;
            if (!enteredPassword) { showPremiumNotification("Field Empty", "Please enter your account password!", true); return; }
            submitBtn.innerText = "Verifying Identity Auth...";
            submitBtn.disabled = true;
            auth.signInWithEmailAndPassword(currentUserEmail, enteredPassword)
            .then(() => {
                showPremiumNotification("Verification Passed", `Credentials verified! Loading ${currentUserRole} workspace...`, false);
                document.getElementById('secureGateModal').classList.remove('active');
                submitBtn.innerText = "Verify & Proceed"; submitBtn.disabled = false;
                const targetFile = `${currentUserRole}.html`;
                setTimeout(() => { window.open(targetFile, "_blank"); }, 400);
            })
            .catch((error) => {
                showPremiumNotification("Verification Failed", "Incorrect password! Access denied.", true);
                submitBtn.innerText = "Verify & Proceed"; submitBtn.disabled = false;
                passwordField.value = "";
            });
        };

        window.pushSoloScore = function() {
            if (!currentUserUid) { showPremiumNotification("Access Denied", "Please sign in to log academic scores!", true); return; }
            const scoreValue = parseInt(document.getElementById('testScoreInputField').value);
            if (isNaN(scoreValue) || scoreValue < 0) { showPremiumNotification("Invalid Input", "Please enter a valid positive score structure.", true); return; }
            const btn = document.getElementById('submitScoreBtn');
            btn.innerText = "Syncing via Secure Backend..."; btn.disabled = true;

            // SECURITY NOTE: this no longer writes to Supabase directly from the client.
            // It calls the same /api/backend endpoint used elsewhere (action=verify-prn),
            // so the actual write happens server-side via the Supabase Admin SDK — the client
            // only ever sends the attempted score and never touches the database directly.
            // Backend TODO: implement action=submit-solo-score — verify the uid via Admin Auth,
            // then run the same "only update if higher" transaction server-side on
            // collection('solo').doc(uid), and respond { success, status: 'created'|'updated'|'not_beaten' }.
            fetch('https://studybuddypro-psi.vercel.app/api/backend?action=submit-solo-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUserUid, name: currentUserName, email: currentUserEmail, score: scoreValue })
            })
            .then(r => r.json())
            .then((result) => {
                btn.innerText = "Push Simulated Score"; btn.disabled = false;
                const status = result && result.status;
                if (status === "created" || status === "updated") {
                    showPremiumNotification("Cloud Synced", `Highscore updated successfully to ${scoreValue}!`, false);
                    if (typeof window.syncSoloLeaderboard === 'function') { window.syncSoloLeaderboard(); }
                } else if (status === "not_beaten") {
                    showPremiumNotification("Record Safe", `Score ${scoreValue} didn't beat your personal best.`, false);
                } else {
                    showPremiumNotification("Sync Error", "Backend didn't accept the score. Please try again.", true);
                }
            })
            .catch((error) => {
                console.error("Backend Sync Error:", error);
                btn.innerText = "Push Simulated Score"; btn.disabled = false;
                showPremiumNotification("Sync Error", "Couldn't reach the secure backend endpoint.", true);
            });
        };
    