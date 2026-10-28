
        document.documentElement.setAttribute('data-theme', 'light');

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const toggleIcon = document.querySelector('#themeToggleBtn i');
            if (currentTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'light');
                toggleIcon.className = "fa-solid fa-moon"; 
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                toggleIcon.className = "fa-solid fa-sun"; 
            }
        }

        function openSidebar() { mySidebar.classList.add('active'); sidebarOverlay.style.display = 'block'; document.body.style.overflow = 'hidden'; }
        function closeSidebar() { mySidebar.classList.remove('active'); sidebarOverlay.style.display = 'none'; document.body.style.overflow = ''; }
        function openProfileModal() { closeSidebar(); document.getElementById('profileDetailsModal').classList.add('active'); }
        function closeProfileModal() { document.getElementById('profileDetailsModal').classList.remove('active'); }
        function closeSecureGateModal() { document.getElementById('secureGateModal').classList.remove('active'); }
        function openAboutModal() { closeSidebar(); document.getElementById('aboutUsModal').classList.add('active'); }

        // ── Hidden debug console (temporary) ──────────────────────────────
        // Not a visible button anywhere. Tapping the existing "Settings"
        // sidebar item normally does nothing new (still shows the usual
        // behaviour). Only 5 quick taps within 2.5s on that same item
        // opens a read-only-ish console (view logs/errors/localStorage —
        // no page/DOM editing) for debugging. Remove this whole block +
        // the id on the Settings link once debugging is done.
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
        function closeAboutModal() { document.getElementById('aboutUsModal').classList.remove('active'); }

        function openSoloMcqHub() {
            document.getElementById('soloMcqOverlayHub').classList.add('active');
            if (typeof window.syncSoloLeaderboard === 'function') { window.syncSoloLeaderboard(); }
        }
        function closeSoloMcqHub() { document.getElementById('soloMcqOverlayHub').classList.remove('active'); }

        function redirectToApprovalPage() {
            closeSidebar();
            showPremiumNotification("Redirecting...", "Opening approval request console panel.", false);
            setTimeout(() => { window.location.href = "edit-profile-request"; }, 600);
        }

        function openMCQPage() { window.location.href = "mcq-file"; }
        function openPYQPage() { window.location.href = "pyq-file"; }
        function openNotesPage() { window.location.href = "notes-file"; }
        function openCertificatePage() { closeSidebar(); window.location.href = "certificate"; }

        function playMasterWelcomeVoice() {
            try {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance("Welcome Sir");
                    utterance.lang = 'en-US'; utterance.rate = 0.85; utterance.pitch = 0.9; utterance.volume = 1.0;
                    const voices = window.speechSynthesis.getVoices();
                    const premiumVoice = voices.find(voice => voice.name.includes("Google US English") || voice.name.includes("Microsoft David") || voice.name.includes("Natural"));
                    if (premiumVoice) utterance.voice = premiumVoice;
                    window.speechSynthesis.speak(utterance);
                }
            } catch(e) { console.error("Voice Engine Error:", e); }
        }

        function playStudentDangerAlarmSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') { ctx.resume(); }
                const now = ctx.currentTime;
                const mainOsc = ctx.createOscillator();
                const mainGain = ctx.createGain();
                mainOsc.type = 'sawtooth';
                mainOsc.frequency.setValueAtTime(500, now);
                for (let i = 0; i < 5; i += 0.5) {
                    mainOsc.frequency.linearRampToValueAtTime(950, now + i + 0.25);
                    mainOsc.frequency.linearRampToValueAtTime(400, now + i + 0.5);
                }
                mainGain.gain.setValueAtTime(0.4, now);
                mainGain.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
                mainOsc.connect(mainGain);
                mainGain.connect(ctx.destination);
                mainOsc.start(now);
                setTimeout(() => { try { mainOsc.stop(); ctx.close(); } catch(e){} }, 5000);
            } catch (error) { console.error("Audio Engine Error:", error); }
        }

        function triggerStudentWarningEffect(element) {
            const dangerOverlay = document.getElementById('dangerScreenOverlay');
            if (element) element.classList.add('lock-button-shake');
            dangerOverlay.classList.add('active');
            playStudentDangerAlarmSound();
            setTimeout(() => { 
                if (element) element.classList.remove('lock-button-shake'); 
                dangerOverlay.classList.remove('active');
            }, 1500); 
            showPremiumNotification("Access Denied!", "Warning: Student tier accounts do not have console authorization.", true);
        }

        function showPremiumNotification(title, message, isError) {
            const toast = document.getElementById('universalPremiumToast');
            const icon = document.getElementById('toastIconElement');
            const header = document.getElementById('toastHeaderTitle');
            const desc = document.getElementById('toastMessageText');
            header.innerText = title; desc.innerText = message;
            if (isError) {
                toast.className = "premium-toast toast-error active";
                icon.className = "fa-solid fa-triangle-exclamation";
            } else {
                toast.className = "premium-toast toast-success active";
                icon.className = "fa-solid fa-circle-check";
            }
            setTimeout(() => { toast.classList.remove('active'); }, 4500);
        }


        // ── First Year: Question Bank / Answer Bank / Handwritten Notes ──────────
        // Second Year ki tarah: tile tap → seedha subject list → us subject ki PDFs
        // (sirf usi category ki). Subject names woh hain jinke under admin dashboard
        // se files upload hoti hain (m1.html / material-hub / answer.html jaise hi).
        const FY_SUBJECTS = [
            { name: 'M1', label: 'Mathematics I' },
            { name: 'M2', label: 'Mathematics II' },
            { name: 'Physics', label: 'Physics' },
            { name: 'Chemistry', label: 'Chemistry' },
            { name: 'Mechanics', label: 'Mechanics' },
            { name: 'Graphics', label: 'Engineering Graphics' },
            { name: 'BEE', label: 'Basic Electronics & Electrical (BEE)' },
            { name: 'Civil', label: 'Civil Engineering' },
            { name: 'PNPS', label: 'Programming & Problem Solving (PNPS)' },
            { name: 'Communication', label: 'Communication Skills' }
        ];
        const FY_GOLD_ROLES = ['gold', 'diamond', 'master', 'superadmin', 'admin', 'moderator'];
        const FY_SECTIONS = {
            questionBank: { label: 'Question Bank', categories: ['question-bank'], roles: FY_GOLD_ROLES },
            answerBank:   { label: 'Answer Bank', categories: ['answer-bank', 'answer-key'], roles: FY_GOLD_ROLES },
            handwritten:  { label: 'Handwritten Notes', categories: ['notes'], roles: FY_GOLD_ROLES },
            pyq:          { label: 'PYQs', categories: ['pyq'], roles: FY_GOLD_ROLES }
        };
        // 🎬 DEMO — free sample files (admin category '<section>-demo', min_tier free) across all FY subjects.
        function openFYDemo(key) {
            const sec = FY_SECTIONS[key];
            if (!sec) return;
            if (typeof window.openDemoList !== 'function') {
                showPremiumNotification('Error', 'Page पूरी तरह load नहीं हुआ। Reload करके फिर try करें।', true);
                return;
            }
            window.openDemoList(sec.categories.map(function (c) { return c + '-demo'; }), FY_SUBJECTS, 'First Year ' + sec.label + ' (Demo)');
        }
        function openFYSection(key) {
            const sec = FY_SECTIONS[key];
            if (!sec) return;
            if (currentUserRole === 'blank') {
                showPremiumNotification('Please wait', 'Profile load हो रही है, कुछ सेकंड बाद फिर tap करें।', false);
                return;
            }
            if (sec.roles.indexOf(currentUserRole) === -1) { openUpgradePromptModal(sec.label); return; }
            if (typeof window.openSubjectPicker !== 'function') {
                showPremiumNotification('Error', 'Page पूरी तरह load नहीं हुआ। Reload करके फिर try करें।', true);
                return;
            }
            window.openSubjectPicker(sec.categories, [{ title: 'First Year Subjects', items: FY_SUBJECTS }], 'First Year ' + sec.label);
        }

        function handlePremiumBoxClick(boxName) {
            if (boxName === 'MCQNotes') window.location.href = "battle-arena";
            else if (boxName === 'solo') window.location.href = "solo"; 
            else if (boxName === 'HandwrittenNotes') window.location.href = "handwritten-notes";
            else if (boxName === 'QuestionBank') window.location.href = "material-hub";
            else if (boxName === 'PYQs') window.location.href = "pyq";
            else showPremiumNotification("Section Launch", `Opening section modules [${boxName}]`, false);
        }

        if ('speechSynthesis' in window) { window.speechSynthesis.getVoices(); }

        /* ===================================================== */
        /* ===== NEW HOME-SCREEN DASHBOARD HELPER FUNCTIONS ===== */
        /* ===================================================== */

        // Talks to the same Social Mode backend used inside Social Mode itself, so the
        // host page's own bell shows the same follow-request notifications.
        const SOCIAL_BACKEND_URL = "https://study-backend-vccr.onrender.com";

        async function socialApiFetch(url, options) {
            options = options || {};
            let token = null;
            try { token = auth.currentUser ? await auth.currentUser.getIdToken() : null; } catch (err) { token = null; }
            const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
            if (token) headers['Authorization'] = 'Bearer ' + token;
            return fetch(url, Object.assign({}, options, { headers }));
        }

        // Keeps the Social Mode profile (Supabase-backed) in sync with the host
        // dashboard's photo/S-ID, even though Social Mode now lives on its own
        // page (social-mode) and isn't loaded here.
        function socialSyncToBackend(payload) {
            socialApiFetch(SOCIAL_BACKEND_URL + '/api/users/sync', { method: 'POST', body: JSON.stringify(payload) })
                .then(async (res) => { if (!res.ok) console.error('Social sync failed', res.status, await res.text().catch(() => '')); })
                .catch((err) => console.error('Social sync request failed', err));
        }

        function notifTimeAgo(ts) {
            if (!ts) return '';
            const diff = Date.now() - new Date(ts).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'now';
            if (mins < 60) return mins + 'm ago';
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return hrs + 'h ago';
            return Math.floor(hrs / 24) + 'd ago';
        }

        function updateNotificationBadges(count) {
            [document.getElementById('headerNotiBadge'), document.getElementById('bnbNotiBadge')].forEach((el) => {
                if (!el) return;
                if (count > 0) { el.textContent = count > 9 ? '9+' : String(count); el.style.display = ''; }
                else { el.style.display = 'none'; }
            });
        }

        async function refreshNotificationBadge() {
            if (!auth.currentUser) { updateNotificationBadges(0); return; }
            try {
                const res = await socialApiFetch(`${SOCIAL_BACKEND_URL}/api/notifications`);
                const data = await res.json();
                updateNotificationBadges(data.unreadCount || 0);
            } catch (err) { /* non-fatal — badge just stays as it was */ }
        }

        function renderNotificationRow(n) {
            const isRequest = n.type === 'follow_request';
            const icon = isRequest ? 'fa-user-plus' : 'fa-check-double';
            const text = isRequest ? 'wants to follow you' : 'accepted your follow request';
            let actionsHtml = '';
            if (isRequest && n.requestStatus === 'pending') {
                actionsHtml = `<div style="display:flex;gap:6px;flex-shrink:0;">
                        <button onclick="respondToFollowRequestHost('${n.from_uid}','accept')" style="border:none;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;background:linear-gradient(135deg,#ff8fbf,#ff6f9c);color:#fff;">Accept</button>
                        <button onclick="respondToFollowRequestHost('${n.from_uid}','reject')" style="border:none;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;background:rgba(0,0,0,0.06);color:var(--text-main);">Reject</button>
                    </div>`;
            } else if (isRequest) {
                actionsHtml = `<span style="font-size:10px;color:var(--text-muted);flex-shrink:0;">${n.requestStatus === 'accepted' ? 'Accepted' : 'Rejected'}</span>`;
            }
            return `<div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid rgba(0,0,0,0.06);">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,143,191,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid ${icon}" style="color:#ff6f9c;font-size:13px;"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <p style="font-size:12.5px;color:var(--text-main);margin:0;"><strong>${n.from_name || 'Student'}</strong>${n.from_username ? ' @' + n.from_username : ''} ${text}</p>
                        <p style="font-size:10px;color:var(--text-muted);margin:2px 0 0;">${notifTimeAgo(n.created_at)}</p>
                    </div>
                    ${actionsHtml}
                </div>`;
        }

        // ===== ADMIN NOTICE INBOX — polls our own backend (Admin SDK), since RTDB
        // rules are fully locked down (read:false, write:false everywhere) =====
        const NOTICE_PAGE_YEAR = 'first'; // fy serves First Year
        let adminNoticesList = [];
        let adminNoticeUnread = 0;
        let socialUnreadCount = 0;
        let noticePollStarted = false;
        let noticePollInterval = null;

        async function noticeApiFetch(url, options) {
            options = options || {};
            let token = null;
            try { token = auth.currentUser ? await auth.currentUser.getIdToken() : null; } catch (err) { token = null; }
            const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
            if (token) headers['Authorization'] = 'Bearer ' + token;
            return fetch(url, Object.assign({}, options, { headers }));
        }

        function isNativeApp() {
            return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        }
        function getWebPermissionState() {
            return (typeof Notification !== 'undefined') ? Notification.permission : 'default';
        }

        let pushReminderPopupShown = false;
        function maybeShowPushReminderPopup(pending) {
  if (isNativeApp && isNativeApp() && window.SBZNativePush) return; // APK: handled by SBZNativePush.bootstrap
  if (!pending || pushReminderPopupShown) return;
  if (!pushSupported()) return;
  if (!isNativeApp()) {
    // granted: sync handle karta hai. denied: popup ka "Enable" button kuch kar hi nahi sakta (browser prompt dobara nahi dikhata) -> banner dikhega
    const p = (typeof Notification !== 'undefined') ? Notification.permission : 'default';
    if (p !== 'default') return;
  }
  pushReminderPopupShown = true;
  showPushReminderModal();
}

        // Asked once automatically on login/signup (per device). If the user taps
        // "Not now", it will NOT ask again on its own — after that it only shows
        // again when the admin panel sends a push reminder request for this user
        // (handled by maybeShowPushReminderPopup above via pushReminders/{uid}).
        async function maybeShowLoginPushPrompt(uid) {
  if (isNativeApp() && window.SBZNativePush) { window.SBZNativePush.bootstrap(sendTokenToBackend); return; } // APK: OS permission per device, ignore server-side status
            if (pushReminderPopupShown) return;
            if (!pushSupported()) return;
            const askedKey = 'pushAsked_' + uid;
            if (localStorage.getItem(askedKey)) return;

            if (isNativeApp()) {
                const { PushNotifications } = window.Capacitor.Plugins;
                const status = await PushNotifications.checkPermissions();
                if (status.receive !== 'prompt' && status.receive !== 'prompt-with-rationale') return;
            } else if (getWebPermissionState() !== 'default') {
                return;
            }

            // Is ID par pehle se kisi device se notification enable hai -> dobara allow nahi poochna
    try {
      const rs = await noticeApiFetch('/api/notices?year=' + NOTICE_PAGE_YEAR + '&pushStatus=1');
      const ds = await rs.json();
      if (ds && ds.pushReminder === false) { localStorage.setItem(askedKey, '1'); return; }
    } catch (e) { /* offline: normal flow */ }
    localStorage.setItem(askedKey, '1');
            pushReminderPopupShown = true;
            showPushReminderModal();
        }

        function showPushReminderModal() {
            const overlay = document.createElement('div');
            overlay.id = 'pushReminderOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
            overlay.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:22px 20px;max-width:320px;width:100%;text-align:center;">
                    <div style="font-size:32px;margin-bottom:8px;">🔔</div>
                    <p style="font-weight:800;font-size:15px;margin:0 0 6px;color:#1a1a1a;">Turn on notifications?</p>
                    <p style="font-size:12.5px;color:#6b7280;margin:0 0 16px;">Enable notifications to get important notices even when you're not on the site.</p>
                    <button id="pushReminderEnableBtn" style="width:100%;padding:10px;border:none;border-radius:10px;background:#ff6f9c;color:#fff;font-weight:700;margin-bottom:8px;">Enable Notifications</button>
                    <button id="pushReminderDismissBtn" style="width:100%;padding:10px;border:none;background:transparent;color:#6b7280;font-size:12px;">Not now</button>
                </div>`;
            document.body.appendChild(overlay);
            document.getElementById('pushReminderEnableBtn').onclick = async () => {
                await requestPushPermission();
                overlay.remove();
            };
            document.getElementById('pushReminderDismissBtn').onclick = () => overlay.remove();
        }

        async function fetchAdminNotices() {
            if (!currentUserUid) return;
            try {
                const res = await noticeApiFetch('/api/notices?year=' + NOTICE_PAGE_YEAR);
                const data = await res.json();
                adminNoticesList = data.notifications || [];
                adminNoticeUnread = data.unreadCount || 0;
                updateNotificationBadges(socialUnreadCount + adminNoticeUnread);
                maybeShowPushReminderPopup(data.pushReminder);
                const modal = document.getElementById('notificationsPanelModal');
                if (modal && modal.classList.contains('active')) loadNotificationsPanelList();
            } catch (err) { /* keep last known state on a transient network error */ }
        }

        function startAdminNoticeListeners() {
            if (noticePollStarted || !currentUserUid) return;
            noticePollStarted = true;
            fetchAdminNotices();
            noticePollInterval = setInterval(() => { if (currentUserUid) fetchAdminNotices(); }, 45000);
            syncPushTokenIfAlreadyGranted();
            updatePushBanner();
        }

        function stopAdminNoticeListeners() {
            noticePollStarted = false;
            if (noticePollInterval) { clearInterval(noticePollInterval); noticePollInterval = null; }
            adminNoticesList = []; adminNoticeUnread = 0;
        }

        // ===== PUSH NOTIFICATIONS (delivered even when the site is closed) =====
        // Requires a VAPID key from Supabase Console → Project Settings → Cloud
        // Messaging → Web Push certificates.
        const FCM_VAPID_KEY = 'BE-cfb3s-ngz6bm-qNUal558C0Jw6be23dZ5CDDnnq_v5NIlLsVuYuH5vFCA3cHV6F5CNYz-y4_wFh8VXUlhvSs'; // Web Push public VAPID key (private key lives only in Manager's Vercel env)


        function pushSupported() {
        if (isNativeApp()) return true;
        return ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
        }

        function b64ToU8(b64) {
        const pad = '='.repeat((4 - b64.length % 4) % 4);
        const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
        return Uint8Array.from(raw, (c) => c.charCodeAt(0));
        }

        // Returns a PushSubscription JSON object (not an FCM token). null if unavailable.
        async function getPushToken() {
  if (isNativeApp() || !pushSupported()) return null;
  // Purane FCM-era worker (alag scope) hata do — stale/duplicate notifications se bachne ke liye
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => r.active && /firebase-messaging-sw\.js/.test(r.active.scriptURL)).map((r) => r.unregister()));
  } catch (e) { /* ignore */ }
  const reg = await navigator.serviceWorker.register('/push-sw.js');
  await navigator.serviceWorker.ready;
  const wantKey = b64ToU8(FCM_VAPID_KEY);
  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    // Agar purani subscription alag VAPID key se bani thi, server uski taraf push nahi bhej payega -> dobara banao
    const cur = sub.options && sub.options.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
    const same = cur && cur.length === wantKey.length && cur.every((v, i) => v === wantKey[i]);
    if (!same) { try { await sub.unsubscribe(); } catch (e) { /* ignore */ } sub = null; }
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: wantKey });
  return sub.toJSON();
}

        async function sendTokenToBackend(token) {
        const body = (token && typeof token === 'object')
        ? { action: 'register-token', subscription: token, year: NOTICE_PAGE_YEAR }
        : { action: 'register-token', token, year: NOTICE_PAGE_YEAR };
        const res = await noticeApiFetch('/api/notices', { method: 'POST', body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        console.log('[Push] register-token response:', res.status, data);
        return res.ok;
        }

        async function requestNativePushPermission() {
  if (window.SBZNativePush) return window.SBZNativePush.bootstrap(sendTokenToBackend, { force: true }).then(function () {});
            try {
                const { PushNotifications } = window.Capacitor.Plugins;
                let status = await PushNotifications.checkPermissions();
                if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
                    status = await PushNotifications.requestPermissions();
                }
                if (status.receive !== 'granted') { console.warn('[Push][native] permission denied'); return; }

                PushNotifications.addListener('registration', async (token) => {
                    console.log('[Push][native] token:', token.value.slice(0, 12) + '...');
                    await sendTokenToBackend(token.value);
                });
                PushNotifications.addListener('registrationError', (err) => {
                    console.error('[Push][native] registration error:', err);
                });

                await PushNotifications.register();
            } catch (err) {
                console.error('[Push][native] failed:', err);
            }
        }

        // Silent — only runs if permission was already granted from a previous
        // visit (e.g. token expired / needs a refresh). Never prompts.
        async function syncPushTokenIfAlreadyGranted() {
  if (isNativeApp() && window.SBZNativePush) { window.SBZNativePush.bootstrap(sendTokenToBackend); return; } // APK: register token, and ask OS permission if undecided
            if (!currentUserUid || !pushSupported()) return;
            if (isNativeApp()) {
                try {
                    const { PushNotifications } = window.Capacitor.Plugins;
                    const status = await PushNotifications.checkPermissions();
                    if (status.receive !== 'granted') return;
                    PushNotifications.addListener('registration', async (token) => {
                        await sendTokenToBackend(token.value);
                    });
                    await PushNotifications.register();
                } catch (err) { console.warn('[Push][native] silent sync failed:', err); }
                return;
            }
            if (getWebPermissionState() !== 'granted') return;
            try {
                const token = await getPushToken();
                if (token) await sendTokenToBackend(token);
            } catch (err) { console.warn('[Push] silent sync failed:', err); }
        }

        // Must be called directly from a click handler — browsers silently
        // suppress the permission prompt (or show a muted address-bar icon
        // instead of a popup) if it isn't triggered by real user interaction.
        async function requestPushPermission() {
  if (isNativeApp()) { return requestNativePushPermission(); }
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|; wv\)|MiuiBrowser.*XiaoMi/i.test(ua);
  const BLOCKED = 'Notifications aapke browser me BLOCK hain.\n\nAllow karne ke liye: address bar ke 🔒 icon par tap karein → Permissions / Site settings → Notifications → Allow. Phir page reload karein.';
  if (!pushSupported()) {
    if (isIOS && !window.navigator.standalone) alert('iPhone par notifications ke liye pehle Safari me Share → "Add to Home Screen" karein, phir home-screen icon se app kholkar Allow karein.');
    else if (inApp) alert('Ye in-app browser notifications support nahi karta. Link ko Chrome / Safari me kholein.');
    else alert('Is browser me push notifications supported nahi hain. Chrome / Safari use karein.');
    return;
  }
  try {
    if (Notification.permission === 'denied') { alert(BLOCKED); updatePushBanner(); return; }
    const permission = await Notification.requestPermission();
    console.log('[Push] permission result:', permission);
    if (permission !== 'granted') {
      if (permission === 'denied') alert(BLOCKED);
      updatePushBanner();
      return;
    }
    const token = await getPushToken();
    if (!token) { alert('Notification subscription nahi ban payi. Dobara try karein.'); updatePushBanner(); return; }
    const ok = await sendTokenToBackend(token);
    if (!ok) alert('Allow ho gaya, par server par save nahi hua. Thodi der baad dobara try karein.');
    updatePushBanner();
  } catch (err) {
    console.error('[Push] requestPushPermission failed:', err);
    const msg = String((err && err.message) || err);
    if (/push service|AbortError|registration failed/i.test(msg + ' ' + ((err && err.name) || ''))) {
      alert('Is browser ki push service available nahi (Brave / kuch custom browsers me hota hai). Chrome use karein.\n\n' + msg);
    } else {
      alert('Could not enable notifications: ' + msg);
    }
  }
}

        function updatePushBanner() {
            const banner = document.getElementById('pushEnableBanner');
            if (!banner) return;
            if (isNativeApp()) { banner.style.display = 'none'; return; } // native uses the OS permission dialog, not this banner
            if (!pushSupported() || getWebPermissionState() === 'granted') {
                banner.style.display = 'none';
            } else if (getWebPermissionState() === 'denied') {
                banner.style.display = 'block';
                banner.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">🔕 Notifications are blocked in your browser. Enable them from the site settings (🔒 icon in the address bar) to get notices when you are offline.</span>';
            } else {
                banner.style.display = 'block';
                banner.innerHTML = '<button onclick="requestPushPermission()" style="width:100%;padding:8px;border:none;border-radius:8px;background:#ff6f9c;color:#fff;font-size:11.5px;font-weight:700;">🔔 Enable notifications for offline updates</button>';
            }
        }

        function markNoticeRead(id) {
            noticeApiFetch('/api/notices', { method: 'POST', body: JSON.stringify({ id }) })
                .then(fetchAdminNotices)
                .catch(() => {});
        }

        function markAllNoticesRead() {
            noticeApiFetch('/api/notices', { method: 'POST', body: JSON.stringify({ all: true, year: NOTICE_PAGE_YEAR }) })
                .then(fetchAdminNotices)
                .catch(() => {});
        }

        const NOTICE_TYPE_ICON = { general: 'fa-bullhorn', study: 'fa-book', assignment: 'fa-pen', exam: 'fa-graduation-cap', important: 'fa-triangle-exclamation', event: 'fa-calendar-days' };

        function escapeHtml(s) {
            return (s || '').toString()
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function renderAdminNoticeRow(n) {
            const isUnread = !n.read;
            const icon = NOTICE_TYPE_ICON[n.type] || 'fa-bullhorn';
            const actionHtml = n.actionUrl ? `<a href="${sbzUrl(n.actionUrl)}" onclick="markNoticeRead('${n.id}')" style="display:inline-block;margin-top:6px;font-size:11px;font-weight:700;color:#ff6f9c;">${n.actionText || 'View'} →</a>` : '';
            let attachHtml = '';
            if (n.attachmentType === 'link' && n.attachmentUrl) {
                attachHtml = `<a href="${sbzUrl(n.attachmentUrl)}" rel="noopener" onclick="event.stopPropagation();markNoticeRead('${n.id}')" style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:11px;font-weight:700;color:#ff6f9c;"><i class="fa-solid fa-link"></i> Open Link</a>`;
            } else if (n.attachmentType === 'image' && n.attachmentUrl) {
                attachHtml = `<img src="${sbzUrl(n.attachmentUrl)}" onclick="event.stopPropagation();window.open('${n.attachmentUrl}','_blank')" style="display:block;max-width:100%;max-height:160px;border-radius:8px;margin-top:6px;cursor:pointer;object-fit:cover;"  loading="lazy" decoding="async" alt=""/>`;
            } else if (n.attachmentType === 'pdf' && n.attachmentUrl) {
                // Opens in-page via pdf-viewer-modal.js — the app's WebView
                // was silently blocking page-to-page navigation, so this
                // never navigates anywhere; it renders as an overlay instead.
                attachHtml = `<a href="javascript:void(0)" data-pdf-url="${escapeHtml(n.attachmentUrl)}" data-pdf-name="${escapeHtml(n.attachmentName || 'Notice PDF')}" onclick="event.stopPropagation();markNoticeRead('${n.id}');openPdfViewer(this.dataset.pdfUrl, this.dataset.pdfName)" style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:11px;font-weight:700;color:#ff6f9c;"><i class="fa-solid fa-file-pdf"></i> View PDF${n.attachmentName ? (' — ' + n.attachmentName) : ''}</a>`;
            }
            return `<div onclick="markNoticeRead('${n.id}')" style="display:flex;align-items:flex-start;gap:10px;padding:10px 4px;border-bottom:1px solid rgba(0,0,0,0.06);cursor:pointer;background:${isUnread ? 'rgba(255,111,156,0.06)' : 'transparent'};">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,143,191,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid ${icon}" style="color:#ff6f9c;font-size:13px;"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <p style="font-size:12.5px;color:var(--text-main);margin:0;font-weight:${isUnread ? '800' : '500'};">${n.title || ''}${isUnread ? ' <span style="color:#ff6f9c;font-size:9px;font-weight:800;">• NEW</span>' : ''}</p>
                        <p style="font-size:11.5px;color:var(--text-muted);margin:3px 0 0;">${n.message || ''}</p>
                        ${attachHtml}
                        ${actionHtml}
                        <p style="font-size:10px;color:var(--text-muted);margin:4px 0 0;">${notifTimeAgo(n.createdAt)}</p>
                    </div>
                </div>`;
        }

        async function loadNotificationsPanelList() {
            const container = document.getElementById('notificationsPanelList');
            container.innerHTML = '<p style="font-size:13px;color:var(--text-muted);text-align:center;padding:24px 0;">Loading...</p>';

            const noticesHtml = adminNoticesList.map(renderAdminNoticeRow).join('');

            let socialHtml = '';
            try {
                const res = await socialApiFetch(`${SOCIAL_BACKEND_URL}/api/notifications`);
                const data = await res.json();
                const items = data.notifications || [];
                socialHtml = items.map(renderNotificationRow).join('');
                socialApiFetch(`${SOCIAL_BACKEND_URL}/api/notifications/mark-read`, { method: 'POST' }).catch(() => {});
                socialUnreadCount = 0;
            } catch (err) { /* notices still show even if the social backend is unreachable */ }

            const combined = noticesHtml + socialHtml;
            container.innerHTML = combined || '<p style="font-size:13px;color:var(--text-muted);text-align:center;padding:24px 0;">No notifications yet.</p>';
            updateNotificationBadges(socialUnreadCount + adminNoticeUnread);
        }


        window.respondToFollowRequestHost = async function (requesterUid, action) {
            try {
                await socialApiFetch(`${SOCIAL_BACKEND_URL}/api/follow-requests/${requesterUid}/${action}`, { method: 'POST' });
                loadNotificationsPanelList();
            } catch (err) {
                showPremiumNotification('Error', 'Could not update this request. Please try again.', true);
            }
        };

        function comingSoon(featureName) {
            showPremiumNotification("Coming Soon", `"${featureName}" is under development and will be available soon. Stay tuned!`, false);
        }

        function openNotificationsPanel() {
            document.getElementById('notificationsPanelModal').classList.add('active');
            loadNotificationsPanelList();
            updatePushBanner();
        }

        setInterval(() => { if (auth.currentUser) refreshNotificationBadge(); }, 60000);

        function scrollToTicker() {
            const ticker = document.getElementById('appTickerWrapper');
            if (ticker) ticker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function scrollToSubjects() {
            const section = document.getElementById('subjectsSection');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        /* ---- Banner Carousel: dots + auto-scroll ---- */
        (function initBannerCarousel() {
            const track = document.getElementById('bannerTrack');
            const dotsWrap = document.getElementById('bannerDots');
            if (!track || !dotsWrap) return;
            const slides = track.querySelectorAll('.banner-slide');
            slides.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'banner-dot' + (i === 0 ? ' active' : '');
                dot.onclick = () => {
                    track.scrollTo({ left: track.clientWidth * i, behavior: 'smooth' });
                };
                dotsWrap.appendChild(dot);
            });
            const dots = dotsWrap.querySelectorAll('.banner-dot');
            let activeIndex = 0;
            track.addEventListener('scroll', () => {
                const idx = Math.round(track.scrollLeft / track.clientWidth);
                if (idx !== activeIndex && dots[idx]) {
                    dots[activeIndex].classList.remove('active');
                    dots[idx].classList.add('active');
                    activeIndex = idx;
                }
            });
            setInterval(() => {
                if (!slides.length) return;
                const nextIndex = (activeIndex + 1) % slides.length;
                track.scrollTo({ left: track.clientWidth * nextIndex, behavior: 'smooth' });
            }, 4500);
        })();

        /* ---- Personalize progress card + avatar once user data loads ---- */
        function refreshDashboardPersonalization() {
            const nameEl = document.getElementById('progressCardName');
            const avatarBtn = document.getElementById('headerAvatarBtn');
            if (nameEl && currentUserName) nameEl.innerText = currentUserName;
            if (avatarBtn && currentUserName && !currentUserPhotoURL) avatarBtn.innerText = currentUserName.trim().charAt(0).toUpperCase() || 'S';
            const fillEl = document.getElementById('progressCardFill');
            if (fillEl) {
                const progressByRole = { student: '20%', silver: '45%', gold: '70%', diamond: '100%', master: '100%', superadmin: '100%', admin: '100%', moderator: '100%' };
                fillEl.style.width = progressByRole[currentUserRole] || '20%';
            }
        }
        setInterval(refreshDashboardPersonalization, 1000);

        /* ===================================================== */
        /* ===== PROFILE PHOTO UPLOAD (routed via backend) ====== */
        /* ===================================================== */

        const BACKEND_BASE_URL = 'https://studybuddypro-psi.vercel.app/api/backend';
        const PHOTO_TARGET_SIZE = 500;   // px, square — matches recommendation shown to the user
        const PHOTO_JPEG_QUALITY = 0.85;
        const PHOTO_MAX_ORIGINAL_MB = 8; // reject absurdly large originals before we even try to process them

        function applyUserPhotoEverywhere(photoURL) {
            currentUserPhotoURL = photoURL || null;
            const headerAvatar = document.getElementById('headerAvatarBtn');
            const progressAvatar = document.getElementById('progressAvatarDisplay');
            const modalAvatar = document.getElementById('profilePhotoAvatar');
            const initial = (currentUserName || 'S').trim().charAt(0).toUpperCase() || 'S';

            if (currentUserPhotoURL) {
                if (headerAvatar) headerAvatar.innerHTML = `<img src="${sbzUrl(currentUserPhotoURL)}" alt="Profile photo" loading="lazy" decoding="async">`;
                if (progressAvatar) progressAvatar.innerHTML = `<img src="${sbzUrl(currentUserPhotoURL)}" alt="Profile photo" loading="lazy" decoding="async">`;
                if (modalAvatar) modalAvatar.innerHTML = `<img src="${sbzUrl(currentUserPhotoURL)}" alt="Profile photo" loading="lazy" decoding="async">`;
            } else {
                if (headerAvatar) headerAvatar.innerText = initial;
                if (progressAvatar) progressAvatar.innerHTML = `<i class="fa-solid fa-graduation-cap"></i>`;
                if (modalAvatar) modalAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
            }
        }

        function triggerPhotoUpload() {
            if (!currentUserUid) {
                showPremiumNotification("Sign In Required", "Please sign in first to update your profile photo.", true);
                return;
            }
            document.getElementById('profilePhotoInput').click();
        }

        function resizeImageFileToBase64(file, onDone) {
            if (!file.type.startsWith('image/')) {
                showPremiumNotification("Invalid File", "Please select a valid image file (JPG, PNG or WEBP).", true);
                return;
            }
            if (file.size > PHOTO_MAX_ORIGINAL_MB * 1024 * 1024) {
                showPremiumNotification("File Too Large", `Please choose an image under ${PHOTO_MAX_ORIGINAL_MB}MB. It will be auto-resized to ${PHOTO_TARGET_SIZE}×${PHOTO_TARGET_SIZE}px anyway.`, true);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Center-crop to a square, then downscale to PHOTO_TARGET_SIZE — keeps every
                    // user's avatar a consistent, predictable size no matter what they upload.
                    const side = Math.min(img.width, img.height);
                    const sx = (img.width - side) / 2;
                    const sy = (img.height - side) / 2;

                    const canvas = document.createElement('canvas');
                    canvas.width = PHOTO_TARGET_SIZE;
                    canvas.height = PHOTO_TARGET_SIZE;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, sx, sy, side, side, 0, 0, PHOTO_TARGET_SIZE, PHOTO_TARGET_SIZE);

                    onDone(canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY));
                };
                img.onerror = () => showPremiumNotification("Image Error", "Couldn't read this image. Please try a different file.", true);
                img.src = e.target.result;
            };
            reader.onerror = () => showPremiumNotification("File Error", "Couldn't read the selected file.", true);
            reader.readAsDataURL(file);
        }

        function handleProfilePhotoSelect(event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = ""; // allow re-selecting the same file next time
            if (!file) return;
            resizeImageFileToBase64(file, (finalBase64) => {
                const modalAvatar = document.getElementById('profilePhotoAvatar');
                if (modalAvatar) modalAvatar.innerHTML = `<img src="${finalBase64}" alt="Preview" loading="lazy" decoding="async">`;
                uploadProfilePhotoToBackend(finalBase64, { wrapSelector: '.profile-photo-wrap' });
            });
        }

        let pendingMandatoryPhotoBase64 = null;

        function handleMandatoryPhotoSelect(event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = "";
            if (!file) return;
            resizeImageFileToBase64(file, (finalBase64) => {
                pendingMandatoryPhotoBase64 = finalBase64;
                const mAvatar = document.getElementById('mandatoryPhotoAvatar');
                if (mAvatar) mAvatar.innerHTML = `<img src="${finalBase64}" alt="Preview" loading="lazy" decoding="async">`;
                const pickBtn = document.getElementById('mandatoryPhotoPickBtn');
                const submitBtn = document.getElementById('mandatoryPhotoSubmitBtn');
                if (pickBtn) pickBtn.innerText = 'Change Photo';
                if (submitBtn) submitBtn.style.display = '';
            });
        }

        function submitMandatoryPhoto() {
            const statusEl = document.getElementById('mandatoryPhotoStatus');
            if (statusEl) { statusEl.style.color = ''; statusEl.innerText = ''; }

            if (!pendingMandatoryPhotoBase64) {
                if (statusEl) { statusEl.style.color = '#ef4444'; statusEl.innerText = 'Pehle ek photo chuno, phir Submit karo.'; }
                return;
            }
            const submitBtn = document.getElementById('mandatoryPhotoSubmitBtn');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Uploading...'; }
            if (statusEl) { statusEl.style.color = ''; statusEl.innerText = 'Uploading photo, please wait...'; }

            uploadProfilePhotoToBackend(pendingMandatoryPhotoBase64, {
                wrapSelector: '.mandatory-photo-wrap',
                onSuccess: () => {
                    pendingMandatoryPhotoBase64 = null;
                    if (statusEl) { statusEl.style.color = '#10b981'; statusEl.innerText = 'Photo saved! Closing...'; }
                    hideMandatoryPhotoOverlay();
                },
                onError: (message) => {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = 'Submit Photo'; }
                    if (statusEl) { statusEl.style.color = '#ef4444'; statusEl.innerText = 'Failed: ' + message; }
                }
            });
        }

        function handleProfilePhotoSelect(event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = ""; // allow re-selecting the same file next time
            if (!file) return;
            resizeImageFileToBase64(file, (finalBase64) => {
                const modalAvatar = document.getElementById('profilePhotoAvatar');
                if (modalAvatar) modalAvatar.innerHTML = `<img src="${finalBase64}" alt="Preview" loading="lazy" decoding="async">`;
                uploadProfilePhotoToBackend(finalBase64, { wrapSelector: '.profile-photo-wrap' });
            });
        }

        function uploadProfilePhotoToBackend(imageBase64, options) {
            options = options || {};
            const wrap = options.wrapSelector ? document.querySelector(options.wrapSelector) : null;
            if (wrap) wrap.classList.add('profile-photo-uploading');
            showPremiumNotification("Uploading...", "Syncing your new profile photo to the server.", false);

            // NOTE FOR BACKEND: this calls the SAME /api/backend endpoint already used for
            // action=verify-prn. action=upload-photo (already implemented) uploads the image
            // to Cloudinary via the Admin-SDK-backed serverless function, then writes only the
            // resulting secure_url to RTDB users/{prn}/photoURL — the client never touches
            // Cloudinary or the database directly.
            // Returns the underlying promise so callers (like the mandatory photo gate)
            // can show their OWN inline success/error text — toasts can be visually hidden
            // behind full-screen overlays, so don't rely on them alone for critical feedback.
            return fetch(`${BACKEND_BASE_URL}?action=upload-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUserUid, image: imageBase64 })
            })
            .then(async (r) => {
                let result = null;
                try { result = await r.json(); } catch (e) { /* non-JSON response */ }

                if (wrap) wrap.classList.remove('profile-photo-uploading');

                if (r.ok && result && result.success && result.photoURL) {
                    applyUserPhotoEverywhere(result.photoURL);
                    showPremiumNotification("Photo Updated", "Your profile photo has been updated successfully!", false);
                    // Keep Social Mode's Supabase profile in sync with this same photo
                    if (window.socialSyncToBackend) window.socialSyncToBackend({ photoURL: result.photoURL });
                    if (typeof options.onSuccess === 'function') options.onSuccess();
                    return { ok: true };
                }

                const serverMsg = (result && (result.message || result.error)) || `Server error (HTTP ${r.status}).`;
                showPremiumNotification("Upload Failed", "Server couldn't save your photo. Please try again.", true);
                if (typeof options.onError === 'function') options.onError(serverMsg);
                return { ok: false, message: serverMsg };
            })
            .catch((err) => {
                if (wrap) wrap.classList.remove('profile-photo-uploading');
                showPremiumNotification("Connection Error", "Couldn't reach the server to upload your photo.", true);
                const msg = "Connection error — couldn't reach the photo server. Check your internet and try again.";
                if (typeof options.onError === 'function') options.onError(msg);
                return { ok: false, message: msg };
            });
        }

        /* ===================================================== */
        /* ===== MANDATORY PHOTO GATE (first login, one-time) === */
        /* ===================================================== */

        function showMandatoryPhotoOverlay() {
            const overlay = document.getElementById('mandatoryPhotoOverlay');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideMandatoryPhotoOverlay() {
            const overlay = document.getElementById('mandatoryPhotoOverlay');
            if (overlay) overlay.classList.remove('active');
            if (!document.querySelector('.mandatory-photo-overlay.active')) document.body.style.overflow = '';
        }

        function hideAuthGateLoader() {
            const loader = document.getElementById('authGateLoader');
            if (!loader || loader.classList.contains('agl-fade-out')) return;
            loader.classList.add('agl-fade-out');
            setTimeout(() => loader.remove(), 350);
        }
        // Safety net: never let a network hiccup trap the user on a blank spinner forever.
        setTimeout(hideAuthGateLoader, 8000);

        // Called every time user data loads. Runs BOTH mandatory gates in sequence:
        // 1) Photo gate first (existing behaviour) — blocks until a photoURL exists.
        // 2) Once photo is set, S ID gate — blocks until a unique S ID is created.
        // The RTDB listener re-fires after either write, so gates advance automatically.
        function runMandatoryGates(photoURL, sid) {
            if (!currentUserUid) {
                hideMandatoryPhotoOverlay();
                hideMandatorySidOverlay();
                return;
            }
            if (!photoURL) {
                hideMandatorySidOverlay();
                showMandatoryPhotoOverlay();
            } else if (!sid) {
                hideMandatoryPhotoOverlay();
                showMandatorySidOverlay();
                prefillSidSuggestionIfEmpty();
            } else {
                hideMandatoryPhotoOverlay();
                hideMandatorySidOverlay();
            }
        }

        function triggerMandatoryPhotoUpload() {
            document.getElementById('mandatoryPhotoInput').click();
        }

        /* ===================================================== */
        /* ===== MANDATORY S ID GATE (one-time, after photo) ==== */
        /* ===================================================== */

        function showMandatorySidOverlay() {
            const overlay = document.getElementById('mandatorySidOverlay');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideMandatorySidOverlay() {
            const overlay = document.getElementById('mandatorySidOverlay');
            if (overlay) overlay.classList.remove('active');
            if (!document.querySelector('.mandatory-photo-overlay.active')) document.body.style.overflow = '';
        }

        function sanitizeSidValue(v) {
            return (v || '').toLowerCase().replace(/[^a-z0-9._]/g, '');
        }

        let sidCheckTimer = null;

        function handleSidInputChange() {
            const input = document.getElementById('sidInput');
            const cleaned = sanitizeSidValue(input.value);
            if (cleaned !== input.value) input.value = cleaned;

            const statusEl = document.getElementById('sidStatusMsg');
            const submitBtn = document.getElementById('sidSubmitBtn');
            submitBtn.disabled = true;
            clearTimeout(sidCheckTimer);

            const val = input.value.trim();
            if (val.length === 0) { statusEl.innerText = ''; statusEl.className = 'sid-status'; return; }
            if (val.length < 3) {
                statusEl.innerText = 'कम से कम 3 characters चाहिए।';
                statusEl.className = 'sid-status sid-status-error';
                return;
            }
            if (val.includes('..') || val.startsWith('.') || val.endsWith('.')) {
                statusEl.innerText = '"." शुरू/अंत में या लगातार दो बार नहीं आ सकता।';
                statusEl.className = 'sid-status sid-status-error';
                return;
            }

            statusEl.innerText = 'Checking availability...';
            statusEl.className = 'sid-status';
            sidCheckTimer = setTimeout(() => checkSidAvailability(val), 500);
        }

        function checkSidAvailability(sid) {
            const statusEl = document.getElementById('sidStatusMsg');
            const submitBtn = document.getElementById('sidSubmitBtn');
            fetch(`${BACKEND_BASE_URL}?action=check-sid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid })
            })
            .then(r => r.json())
            .then((result) => {
                // Stale response guard: ignore if the input has moved on since this check started
                if (document.getElementById('sidInput').value.trim() !== sid) return;
                if (result && result.valid && result.available) {
                    statusEl.innerText = '✅ यह S ID उपलब्ध है!';
                    statusEl.className = 'sid-status sid-status-ok';
                    submitBtn.disabled = false;
                } else if (result && result.valid && !result.available) {
                    statusEl.innerText = '❌ यह S ID पहले से लिया जा चुका है।';
                    statusEl.className = 'sid-status sid-status-error';
                    submitBtn.disabled = true;
                } else {
                    statusEl.innerText = '❌ Invalid S ID format।';
                    statusEl.className = 'sid-status sid-status-error';
                    submitBtn.disabled = true;
                }
            })
            .catch(() => {
                statusEl.innerText = 'Connection error, दोबारा कोशिश करें।';
                statusEl.className = 'sid-status sid-status-error';
            });
        }

        function suggestSid() {
            const base = sanitizeSidValue((currentUserName || 'user').replace(/\s+/g, '.'));
            const candidate = ((base || 'user').slice(0, 14) + '.' + Math.floor(1000 + Math.random() * 9000)).slice(0, 20);
            const input = document.getElementById('sidInput');
            input.value = candidate;
            handleSidInputChange();
        }

        function prefillSidSuggestionIfEmpty() {
            const input = document.getElementById('sidInput');
            if (input && input.value.trim() === '') suggestSid();
        }

        function submitSid() {
            const input = document.getElementById('sidInput');
            const sid = input.value.trim();
            const submitBtn = document.getElementById('sidSubmitBtn');
            submitBtn.disabled = true; submitBtn.innerText = 'Setting...';

            fetch(`${BACKEND_BASE_URL}?action=create-sid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUserUid, sid })
            })
            .then(r => r.json())
            .then((result) => {
                if (result && result.success) {
                    currentUserSid = result.sid;
                    const sidDisplay = document.getElementById('profSid');
                    if (sidDisplay) sidDisplay.innerText = '@' + result.sid;
                    hideMandatorySidOverlay();
                    showPremiumNotification('S ID Set', 'आपका S ID @' + result.sid + ' सफलतापूर्वक बन गया!', false);
                    submitBtn.innerText = 'S ID Set करें';
                    // Keep Social Mode's Supabase/Supabase profile's public username in sync
                    if (window.socialSyncToBackend) window.socialSyncToBackend({ username: result.sid });
                } else {
                    const statusEl = document.getElementById('sidStatusMsg');
                    statusEl.innerText = (result && result.error) || 'S ID set नहीं हो पाया।';
                    statusEl.className = 'sid-status sid-status-error';
                    submitBtn.disabled = false; submitBtn.innerText = 'S ID Set करें';
                }
            })
            .catch(() => {
                const statusEl = document.getElementById('sidStatusMsg');
                statusEl.innerText = 'Connection error, दोबारा कोशिश करें।';
                statusEl.className = 'sid-status sid-status-error';
                submitBtn.disabled = false; submitBtn.innerText = 'S ID Set करें';
            });
        }
    