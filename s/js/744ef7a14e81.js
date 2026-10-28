
(function () {
  /* ===== Admin Notice Inbox engine (moved out of Social Mode so the
     bell keeps working now that Social Mode lives in social-mode) ===== */
  function createStore(initial) {
    let state = initial;
    const listeners = new Set();
    return {
      get: () => state,
      set: (updater) => { state = typeof updater === "function" ? updater(state) : updater; listeners.forEach((l) => l()); },
      subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); }
    };
  }
  // ===== ADMIN NOTICE INBOX — polls our own backend (Admin SDK), since RTDB
  // rules are fully locked down (read:false, write:false everywhere) =====
  const NOTICE_PAGE_YEAR = 'third'; // third-year serves Third Year
  let adminNoticesList = [];
  let noticePollStarted = false;
  let noticePollInterval = null;
  const adminNoticeStore = createStore({ unread: 0 });

  function getSessionUserForNotices() {
    try { return (window.SBZLegacy) ? SBZLegacy.auth().currentUser : null; } catch (err) { return null; }
  }

  async function noticeApiFetch(url, options) {
    options = options || {};
    const user = getSessionUserForNotices();
    let token = null;
    try { token = user ? await user.getIdToken() : null; } catch (err) { token = null; }
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, Object.assign({}, options, { headers }));
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
  function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

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
    } else if (Notification.permission !== 'default') {
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
    const user = getSessionUserForNotices();
    if (!user) return;
    try {
      const res = await noticeApiFetch('/api/notices?year=' + NOTICE_PAGE_YEAR);
      const data = await res.json();
      adminNoticesList = data.notifications || [];
      const unread = data.unreadCount || 0;
      adminNoticeStore.set({ unread });
      maybeShowPushReminderPopup(data.pushReminder);
    } catch (err) { /* keep last known state on a transient network error */ }
  }

  function startAdminNoticeListeners() {
    const user = getSessionUserForNotices();
    if (noticePollStarted || !user) return;
    noticePollStarted = true;
    fetchAdminNotices();
    noticePollInterval = setInterval(() => { if (getSessionUserForNotices()) fetchAdminNotices(); }, 45000);
    syncPushTokenIfAlreadyGranted();
    updatePushBanner();
  }

  function stopAdminNoticeListeners() {
    noticePollStarted = false;
    if (noticePollInterval) { clearInterval(noticePollInterval); noticePollInterval = null; }
    adminNoticesList = [];
    adminNoticeStore.set({ unread: 0 });
  }

  // ===== PUSH NOTIFICATIONS (delivered even when the site is closed) =====
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

  // Silent — only refreshes the token if permission was already granted
  // earlier. Never prompts.
  async function syncPushTokenIfAlreadyGranted() {
  if (isNativeApp() && window.SBZNativePush) { window.SBZNativePush.bootstrap(sendTokenToBackend); return; } // APK: register token, and ask OS permission if undecided
    const user = getSessionUserForNotices();
    if (!user || !pushSupported()) return;
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
    if (Notification.permission !== 'granted') return;
    try {
      const token = await getPushToken();
      if (token) await sendTokenToBackend(token);
    } catch (err) { console.warn('[Push] silent sync failed:', err); }
  }

  // Must be called directly from a click handler — browsers silently
  // suppress the permission prompt if it isn't triggered by real user
  // interaction, which is why the old auto-call on login never showed one.
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

  const pushPermissionStore = createStore({ perm: (('Notification' in window) ? Notification.permission : 'unsupported') });
  function refreshPushPermissionState() {
    pushPermissionStore.set({ perm: ('Notification' in window) ? Notification.permission : 'unsupported' });
  }
  function updatePushBanner() { refreshPushPermissionState(); }

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

  // Keeps the Social Mode profile (Supabase-backed) in sync with the host
  // dashboard's photo/S-ID, even though Social Mode now lives on its own
  // page (social-mode) and isn't loaded here.
  const SOCIAL_BACKEND_URL = "https://study-backend-vccr.onrender.com";
  window.socialSyncToBackend = socialSyncToBackend; // exposed globally — the login/name-fetch code (a separate script block) calls this
  function socialSyncToBackend(payload) {
    noticeApiFetch(SOCIAL_BACKEND_URL + '/api/users/sync', { method: 'POST', body: JSON.stringify(payload) })
      .then(async (res) => { if (!res.ok) console.error('Social sync failed', res.status, await res.text().catch(() => '')); })
      .catch((err) => console.error('Social sync request failed', err));
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h';
    return Math.floor(hrs / 24) + 'd';
  }

  window.AdminNotices = {
    getList: () => adminNoticesList,
    getUnreadCount: () => adminNoticeStore.get().unread,
    subscribe: (cb) => adminNoticeStore.subscribe(cb),
    refresh: fetchAdminNotices,
    markRead: markNoticeRead,
    markAllRead: markAllNoticesRead,
    start: startAdminNoticeListeners,
    stop: stopAdminNoticeListeners,
    timeAgo: timeAgo,
    maybeShowLoginPushPrompt: maybeShowLoginPushPrompt
  };
})();
