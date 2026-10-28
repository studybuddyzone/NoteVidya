
(function () {
  const BACKEND_URL = "https://study-backend-vccr.onrender.com";

  // ── Direct-to-Supabase reads (bypasses the Render/Express server) ─────────
  // PERFORMANCE FIX: profile lookups, search, followers/following lists, and
  // gallery reads used to all go through the Render backend on every tap —
  // that's what was making browsing feel slow. Those are all read-only and
  // considered "public" data (like Instagram's public profiles), so they now
  // query Supabase directly using the public "anon" key.
  //
  // SECURITY NOTE: writes (follow/unfollow, gallery add, profile sync) and
  // ALL message reads/writes stay on the authenticated Render server — the
  // anon key has read-only access (via Row Level Security policies on the
  // `users` and `follows` tables only) and can NOT read the `messages` table,
  // so private chats can't be read by just anyone with this public key.
  //
  // ⚠️ FILL THESE IN from Supabase → Project Settings → API:
  const SUPABASE_URL = "https://pkaorqkswdductxeoivh.supabase.co"; // e.g. https://xxxxx.supabase.co
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYW9ycWtzd2RkdWN0eGVvaXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDU0NjcsImV4cCI6MjEwMDQ4MTQ2N30.FRc1IcjJS8dGCtgOMuyJbtZVR94YsuEEpfZE1l0op0w"; // the "anon / public" key — NEVER the service_role key here

  let supabasePublic = null;
  try {
    if (window.supabase && SUPABASE_URL.indexOf('YOUR_SUPABASE') === -1) {
      supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (err) { console.warn('SocialMode: Supabase direct client init failed, falling back to API', err); }

  async function sbFetchUserProfile(uid) {
    if (!supabasePublic) return null;
    const { data, error } = await supabasePublic.from('users').select('uid, name, username, photo_url').eq('uid', uid).maybeSingle();
    if (error || !data) return null;
    return { uid: data.uid, name: data.name || 'Student', username: data.username || '', photoURL: data.photo_url || '' };
  }

  async function sbSearchUsers(query) {
    if (!supabasePublic) return null;
    const term = `%${query.replace(/[%,)*]/g, (c) => '\\' + c)}%`;
    const { data, error } = await supabasePublic.from('users').select('uid, name, username, photo_url').or(`name.ilike.${term},username.ilike.${term}`).limit(10);
    if (error) return null;
    return data;
  }

  async function sbGetFollowerIds(uid) {
    if (!supabasePublic) return null;
    const { data, error } = await supabasePublic.from('follows').select('follower_id').eq('following_id', uid);
    if (error) return null;
    return data.map((r) => r.follower_id);
  }

  async function sbGetFollowingIds(uid) {
    if (!supabasePublic) return null;
    const { data, error } = await supabasePublic.from('follows').select('following_id').eq('follower_id', uid);
    if (error) return null;
    return data.map((r) => r.following_id);
  }

  async function sbGetGallery(uid) {
    if (!supabasePublic) return null;
    const { data, error } = await supabasePublic.from('users').select('gallery_photos').eq('uid', uid).maybeSingle();
    if (error || !data) return null;
    return data.gallery_photos || [];
  }

  const SM_ENDPOINTS = {
    search: (q) => `${BACKEND_URL}/api/users/search?q=${encodeURIComponent(q)}`,
    follow: () => `${BACKEND_URL}/api/follow`,
    unfollow: () => `${BACKEND_URL}/api/unfollow`,
    followers: (uid) => `${BACKEND_URL}/api/followers/${uid}`,
    following: (uid) => `${BACKEND_URL}/api/following/${uid}`,
    galleryAdd: () => `${BACKEND_URL}/api/gallery/add`,
    galleryGet: (uid) => `${BACKEND_URL}/api/gallery/${uid}`,
    messages: (otherUid) => `${BACKEND_URL}/api/messages/${otherUid}`,
    userProfile: (uid) => `${BACKEND_URL}/api/users/${uid}`,
    sync: () => `${BACKEND_URL}/api/users/sync`,
    notifications: () => `${BACKEND_URL}/api/notifications`,
    notificationsMarkRead: () => `${BACKEND_URL}/api/notifications/mark-read`,
    acceptFollowRequest: (requesterUid) => `${BACKEND_URL}/api/follow-requests/${requesterUid}/accept`,
    rejectFollowRequest: (requesterUid) => `${BACKEND_URL}/api/follow-requests/${requesterUid}/reject`,
    cancelFollowRequest: (targetUid) => `${BACKEND_URL}/api/follow-requests/${targetUid}/cancel`
  };

  const e = React.createElement;

  /* ---------------- tiny external stores (no Redux needed) ---------------- */
  function createStore(initial) {
    let state = initial;
    const listeners = new Set();
    return {
      get: () => state,
      set: (updater) => { state = typeof updater === 'function' ? updater(state) : updater; listeners.forEach((l) => l()); },
      subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); }
    };
  }
  function useStore(store) { return React.useSyncExternalStore(store.subscribe, store.get); }

  const uiStore = createStore({ open: false, dark: false, tab: 'home', coldStartMsg: null });
  const profileStore = createStore({ uid: null, name: '', username: '', photoURL: '', isPrivate: false, followers: 0, following: 0, followingIds: [] });
  const feedStore = createStore({ loading: true, posts: [] });
  const galleryStore = createStore({ loading: true, photos: [] });
  const viewedProfileStore = createStore({ loading: false, uid: null, name: '', username: '', photoURL: '', isPrivate: false, isFollowing: false, hasPendingRequest: false, followers: 0, following: 0 });
  const viewedGalleryStore = createStore({ loading: true, photos: [], locked: false });
  const followListStore = createStore({ open: false, mode: null, uid: null, loading: false, users: [] });
  const chatOpenRequestStore = createStore({ contact: null });
  const photoLightboxStore = createStore({ open: false, src: '', name: '' });
  function openPhotoLightbox(src, name) {
    if (!src) return; // nothing to enlarge — avoid popping the lightbox over a plain initial-letter avatar
    photoLightboxStore.set({ open: true, src: src, name: name || '' });
  }
  function closePhotoLightbox() { photoLightboxStore.set((s) => Object.assign({}, s, { open: false })); }
  function PhotoLightbox() {
    const lb = useStore(photoLightboxStore);
    if (!lb.open) return null;
    return e('div', {
      onClick: closePhotoLightbox,
      style: { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }
    },
      e('button', {
        onClick: closePhotoLightbox,
        style: { position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }, e(Icon, { name: 'x', size: 18, color: '#fff' })),
      e('img', {
        src: lb.src, alt: lb.name,
        onClick: (ev) => ev.stopPropagation(),
        style: { maxWidth: '92vw', maxHeight: '78vh', width: 'auto', height: 'auto', borderRadius: 20, objectFit: 'contain', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }
      }),
      lb.name && e('p', { style: { color: '#fff', fontSize: 14, fontWeight: 600 } }, lb.name)
    );
  }

  const chatStore = createStore({ loading: true, contacts: [], activeContact: null, view: 'list', messages: [], toast: '', inThread: false });
  // ===== ADMIN NOTICE INBOX — polls our own backend (Admin SDK), since RTDB
  // rules are fully locked down (read:false, write:false everywhere) =====
  const NOTICE_PAGE_YEAR = window.SM_YEAR_CODE; // set by the page shell from ?year=
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
      notificationsStore.set((s) => Object.assign({}, s, { unreadCount: (s.socialUnread || 0) + unread }));
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


  function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

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

  const NOTICE_TYPE_ICON = { general: 'bell', study: 'book-open', assignment: 'pen-line', exam: 'graduation-cap', important: 'triangle-alert', event: 'calendar' };

  function renderAdminNoticeRow(n) {
    const isUnread = !n.read;
    return e('div', {
      key: 'notice-' + n.id,
      onClick: () => markNoticeRead(n.id),
      style: {
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 4px',
        borderBottom: '1px solid var(--glass-border)', cursor: 'pointer',
        background: isUnread ? 'rgba(255,111,156,0.08)' : 'transparent', borderRadius: 8
      }
    },
      e('div', { style: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,143,191,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
        e(Icon, { name: NOTICE_TYPE_ICON[n.type] || 'bell', size: 15, color: '#ff6f9c' })
      ),
      e('div', { style: { flex: 1, minWidth: 0 } },
        e('p', { style: { fontSize: 12.5, color: 'var(--ink)', margin: 0, fontWeight: isUnread ? 800 : 500 } },
          n.title || '', isUnread ? e('span', { style: { color: '#ff6f9c', fontSize: 9, fontWeight: 800, marginLeft: 6 } }, '• NEW') : null
        ),
        e('p', { style: { fontSize: 11.5, color: 'var(--ink-soft)', margin: '3px 0 0' } }, n.message || ''),
        n.actionUrl ? e('a', { href: n.actionUrl, onClick: (ev) => { ev.stopPropagation(); markNoticeRead(n.id); }, style: { display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, color: '#ff6f9c' } }, (n.actionText || 'View') + ' →') : null
      )
    );
  }

  const notificationsStore = createStore({ open: false, loading: false, items: [], unreadCount: 0 });

  /* ---------------- auth + fetch helpers ---------------- */
  function getSessionUser() {
    try { return (window.SBZLegacy) ? SBZLegacy.auth().currentUser : null; } catch (err) { return null; }
  }
  async function getIdToken() {
    const user = getSessionUser();
    if (!user) return null;
    try { return await user.getIdToken(); } catch (err) { return null; }
  }
  async function apiFetch(url, options) {
    options = options || {};
    const token = await getIdToken();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, Object.assign({}, options, { headers }));
  }
  async function safeJson(res) { try { return await res.json(); } catch (err) { return {}; } }
  function fallbackAvatar(seed) {
    const initial = (seed || 'U').trim().charAt(0).toUpperCase();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#FF8FBF"/><text x="50%" y="55%" font-size="34" fill="#fff" text-anchor="middle" font-family="sans-serif">${initial}</text></svg>`
    );
  }
  // Cloudinary always encodes resource_type in the URL path (/image/upload/ vs
  // /video/upload/), plus a fallback on common video file extensions.
  function isVideoUrl(url) {
    if (!url) return false;
    return url.indexOf('/video/upload/') !== -1 || /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);
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

  /* ---------------- icons (feather/lucide-style inline SVGs, no CDN dependency) ---------------- */
  const ICON_PATHS = {
    home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
    compass: ['circle:12,12,10', 'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z'],
    plus: ['M12 5v14', 'M5 12h14'],
    messageCircle: ['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'],
    user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'circle:12,7,4'],
    graduationCap: ['M2 10l10-5 10 5-10 5L2 10z', 'M6 12v5c3 2 9 2 12 0v-5'],
    bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
    search: ['circle:11,11,8', 'M21 21l-4.35-4.35'],
    reply: ['M9 17l-5-5 5-5', 'M4 12h10a6 6 0 0 1 6 6v1'],
    copy: ['rect:9,9,13,13,2', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
    trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'],
    pin: ['M12 2a6 6 0 0 0-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 0 0-6-6z', 'circle:12,8,2'],
    x: ['M18 6L6 18', 'M6 6l12 12'],
    send: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4z'],
    checkCheck: ['M18 6L7 17l-5-5', 'M22 10l-7.5 7.5L13 16'],
    arrowLeft: ['M19 12H5', 'M12 19l-7-7 7-7'],
    heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z'],
    messageSquare: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
    bookmark: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
    grid: ['rect:3,3,7,7,1', 'rect:14,3,7,7,1', 'rect:14,14,7,7,1', 'rect:3,14,7,7,1'],
    settings: ['circle:12,12,3', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.36.83.57 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
    moreHorizontal: ['circle:12,12,1', 'circle:19,12,1', 'circle:5,12,1'],
    camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'circle:12,13,4'],
    playCircle: ['circle:12,12,10', 'M10 8l6 4-6 4z'],
    logOut: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']
  };
  function Icon(props) {
    const name = props.name, size = props.size || 18, color = props.color || 'currentColor';
    const fill = props.fill || 'none', strokeWidth = props.strokeWidth || 2;
    const defs = ICON_PATHS[name] || [];
    const children = defs.map((d, i) => {
      if (d.indexOf('circle:') === 0) {
        const parts = d.slice(7).split(',').map(Number);
        return e('circle', { key: i, cx: parts[0], cy: parts[1], r: parts[2] });
      }
      if (d.indexOf('rect:') === 0) {
        const parts = d.slice(5).split(',').map(Number);
        return e('rect', { key: i, x: parts[0], y: parts[1], width: parts[2], height: parts[3], rx: parts[4] || 0 });
      }
      return e('path', { key: i, d: d });
    });
    return e('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: fill,
      stroke: color, strokeWidth: strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
      style: props.style
    }, children);
  }

  /* ---------------- shared UI atoms ---------------- */
  function GlassCard(props) {
    return e('div', {
      className: props.className || '',
      style: Object.assign({
        background: 'var(--glass)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-soft)', animation: 'smFloatIn 0.35s ease-out'
      }, props.style || {})
    }, props.children);
  }

  function TopBar(props) {
    const ui = useStore(uiStore);
    const nf = useStore(notificationsStore);
    return e('div', { className: 'flex items-center justify-between px-5 pt-6 pb-3' },
      e('h1', { className: 'text-2xl font-bold', style: { color: 'var(--ink)', letterSpacing: '-0.02em' } }, props.title),
      e('div', { className: 'flex items-center gap-3' },
        e('button', {
          onClick: () => uiStore.set((s) => Object.assign({}, s, { tab: 'discover' })),
          className: 'w-11 h-11 flex items-center justify-center transition-transform active:scale-90',
          style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-soft)' }
        }, e(Icon, { name: 'search', size: 18, color: 'var(--ink)' })),
        e('button', {
          onClick: openNotificationsSheet,
          className: 'w-11 h-11 flex items-center justify-center relative transition-transform active:scale-90',
          style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-soft)' }
        },
          e(Icon, { name: 'bell', size: 18, color: 'var(--ink)' }),
          nf.unreadCount > 0 && e('span', { style: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--bg)' } })
        ),
        e('button', {
          onClick: () => uiStore.set((s) => Object.assign({}, s, { dark: !s.dark })),
          className: 'w-11 h-11 flex items-center justify-center transition-transform active:scale-90',
          style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-soft)' }
        }, ui.dark ? '☀️' : '🌙'),
        e('button', {
          onClick: () => window.SocialMode.close(),
          className: 'w-11 h-11 flex items-center justify-center transition-transform active:scale-90',
          style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-soft)' }
        }, e(Icon, { name: 'x', size: 18, color: 'var(--ink)' }))
      )
    );
  }

  const NAV_ITEMS = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'discover', label: 'Explore', icon: 'compass' },
    { key: 'study', label: 'Study Mode', icon: 'graduationCap', isCenter: true },
    { key: 'chat', label: 'Messenger', icon: 'messageCircle' },
    { key: 'profile', label: 'Profile', icon: 'user' }
  ];

  function FloatingNav() {
    const ui = useStore(uiStore);
    const chat = useStore(chatStore);
    const collapsed = ui.tab === 'chat' && chat.inThread;
    const lastIndex = NAV_ITEMS.length - 1;

    return e('div', {
      className: 'fixed bottom-0 flex',
      style: {
        left: 0, right: 0, justifyContent: collapsed ? 'flex-start' : 'center',
        paddingBottom: '12px', paddingLeft: collapsed ? '18px' : '0', zIndex: 50,
        transition: 'padding-left 0.32s cubic-bezier(.22,1,.36,1)'
      }
    },
      e('div', {
        className: 'flex items-end gap-1 px-2.5 py-1.5',
        style: {
          background: 'var(--glass)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid var(--glass-border)', borderRadius: '999px', boxShadow: 'var(--shadow-nav)',
          transition: 'all 0.32s cubic-bezier(.22,1,.36,1)'
        }
      }, NAV_ITEMS.map((item, idx) => {
        const isActive = ui.tab === item.key;
        const isHome = item.key === 'home';
        // Collapse hides everything except Home; the further an item sits from
        // Home, the earlier it disappears when collapsing (right→left) and the
        // later it reappears when expanding (left→right).
        const hideDelay = (lastIndex - idx) * 55;
        const showDelay = idx * 55;
        const hiddenStyle = (!isHome && collapsed) ? {
          width: 0, opacity: 0, transform: 'translateX(16px) scale(0.4)',
          marginLeft: 0, marginRight: 0, pointerEvents: 'none', overflow: 'hidden',
          transitionDelay: (collapsed ? hideDelay : showDelay) + 'ms'
        } : {
          opacity: 1, transform: 'translateX(0) scale(1)', transitionDelay: (collapsed ? hideDelay : showDelay) + 'ms'
        };

        if (item.isCenter) {
          return e('button', {
            key: item.key,
            onClick: () => {
              // Social Mode -> Study Mode: close Social Mode and return to the study dashboard.
              if (window.SocialMode && typeof window.SocialMode.close === 'function') window.SocialMode.close();
              if (typeof sySetActiveNav === 'function') sySetActiveNav('syNavHome');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            className: 'flex items-center justify-center mx-1 transition-transform active:scale-90',
            style: Object.assign({
              width: 50, height: 50, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              boxShadow: '0 10px 24px rgba(255, 143, 191, 0.4), 0 0 0 6px rgba(255,255,255,0.4)',
              transform: 'translateY(-12px)', border: 'none',
              transition: 'all 0.32s cubic-bezier(.22,1,.36,1)'
            }, hiddenStyle)
          }, e(Icon, { name: 'graduationCap', size: 22, color: '#fff', strokeWidth: 2.2 }));
        }
        return e('button', {
          key: item.key,
          onClick: () => {
            if (isHome && collapsed) {
              // Home tap from inside a chat thread: leave the thread and reopen the full bar.
              chatOpenRequestStore.set({ contact: null });
              chatStore.set((s) => Object.assign({}, s, { inThread: false }));
            }
            uiStore.set((s) => Object.assign({}, s, { tab: item.key, viewUid: null }));
          },
          className: 'flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90',
          style: Object.assign({
            width: 48, height: 44, borderRadius: 'var(--radius-sm)', border: 'none',
            background: isActive ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'transparent',
            boxShadow: isActive ? '0 6px 18px rgba(255, 143, 191, 0.4)' : 'none',
            animation: isActive ? 'smPop 0.3s ease' : 'none',
            transition: 'all 0.32s cubic-bezier(.22,1,.36,1)'
          }, hiddenStyle)
        },
          e(Icon, { name: item.icon, size: 18, color: isActive ? '#fff' : 'var(--ink-soft)', strokeWidth: isActive ? 2.4 : 2 }),
          e('span', { className: 'text-[9.5px] font-medium', style: { color: isActive ? '#fff' : 'var(--ink-soft)' } }, item.label)
        );
      }))
    );
  }

  /* ---------------- Stories row (uses "following" list; first bubble = add photo) ---------------- */
  function StoryAvatar(props) {
    const s = props.story;
    return e('button', {
      onClick: props.onClick,
      className: 'flex flex-col items-center gap-1.5 flex-shrink-0', style: { width: 66, border: 'none', background: 'transparent' }
    },
      e('div', { className: 'p-[2.5px] rounded-full relative', style: { background: s.isMe ? 'var(--glass-border)' : 'linear-gradient(135deg, var(--primary), var(--secondary), var(--accent))' } },
        e('div', { className: 'p-[2px] bg-white rounded-full' },
          e('img', { src: s.avatar, alt: s.name, className: 'w-14 h-14 rounded-full object-cover' })
        ),
        s.isMe && e('div', {
          className: 'absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center',
          style: { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: '2px solid #fff' }
        }, e(Icon, { name: 'plus', size: 11, color: '#fff', strokeWidth: 3 }))
      ),
      e('span', { className: 'text-[10px] truncate w-full text-center', style: { color: 'var(--ink-soft)' } }, s.name)
    );
  }

  /* ---------------- Home feed: aggregates gallery photos from people you follow (+ your own) ---------------- */
  function PostCard(props) {
    const post = props.post;
    const [liked, setLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(post.likes || 0);
    const [saved, setSaved] = React.useState(false);
    return e(GlassCard, { style: { padding: 0, overflow: 'hidden' } },
      e('div', { className: 'flex items-center gap-2.5 px-4 py-3' },
        e('img', { src: post.avatar, alt: post.name, className: 'w-9 h-9 rounded-full object-cover', style: { border: '1.5px solid var(--secondary)' } }),
        e('div', { className: 'flex-1 min-w-0' },
          e('p', { className: 'text-sm font-semibold truncate', style: { color: 'var(--ink)' } }, post.name),
          e('p', { className: 'text-[11px]', style: { color: 'var(--ink-soft)' } }, post.time)
        )
      ),
      isVideoUrl(post.image)
        ? e('video', { src: post.image, controls: true, playsInline: true, muted: true, className: 'w-full object-cover', style: { maxHeight: 340, background: '#000' } })
        : e('img', { src: post.image, alt: '', className: 'w-full object-cover', style: { maxHeight: 340 } }),
      e('div', { className: 'px-4 py-3' },
        e('div', { className: 'flex items-center gap-4' },
          e('button', {
            onClick: () => { setLiked((v) => !v); setLikeCount((c) => c + (liked ? -1 : 1)); },
            className: 'flex items-center gap-1.5 transition-transform active:scale-90', style: { border: 'none', background: 'transparent' }
          },
            e(Icon, { name: 'heart', size: 21, color: liked ? 'var(--primary)' : 'var(--ink-soft)', fill: liked ? 'var(--primary)' : 'none' }),
            e('span', { className: 'text-xs font-medium', style: { color: 'var(--ink-soft)' } }, likeCount)
          ),
          e('div', { className: 'flex items-center gap-1.5' }, e(Icon, { name: 'messageSquare', size: 20, color: 'var(--ink-soft)' })),
          e('button', {
            onClick: () => setSaved((v) => !v), className: 'ml-auto transition-transform active:scale-90', style: { border: 'none', background: 'transparent' }
          }, e(Icon, { name: 'bookmark', size: 20, color: saved ? 'var(--primary-dark)' : 'var(--ink-soft)', fill: saved ? 'var(--primary-dark)' : 'none' }))
        ),
        post.caption && e('p', { className: 'text-sm mt-2 leading-snug', style: { color: 'var(--ink)' } },
          e('span', { className: 'font-semibold' }, post.username ? '@' + post.username : post.name), ' ', post.caption
        )
      )
    );
  }

  async function fetchUserProfileById(uid) {
    const direct = await sbFetchUserProfile(uid).catch(() => null);
    if (direct) return Object.assign({ isPrivate: false, isFollowing: true, hasPendingRequest: false }, direct);
    try {
      const res = await apiFetch(SM_ENDPOINTS.userProfile(uid));
      const data = await safeJson(res);
      const u = data.user || data;
      return {
        uid: uid,
        name: u.name || 'Student',
        username: u.username || '',
        photoURL: u.photo_url || u.photoURL || '',
        isPrivate: !!u.is_private,
        isFollowing: !!data.isFollowing,
        hasPendingRequest: !!data.hasPendingRequest
      };
    } catch (err) { return { uid: uid, name: 'Student', username: '', photoURL: '', isPrivate: false, isFollowing: false, hasPendingRequest: false }; }
  }

  async function loadHomeFeed() {
    feedStore.set((s) => Object.assign({}, s, { loading: true }));
    const profile = profileStore.get();
    const ids = (profile.followingIds || []).slice(0, 12);
    const idsWithSelf = profile.uid ? [profile.uid].concat(ids) : ids;

    const results = await Promise.all(idsWithSelf.map(async (uid) => {
      const [profileInfo, photosDirect] = await Promise.all([
        uid === profile.uid
          ? Promise.resolve({ uid: profile.uid, name: profile.name, username: profile.username, photoURL: profile.photoURL })
          : fetchUserProfileById(uid),
        sbGetGallery(uid).catch(() => null)
      ]);
      let photos = photosDirect;
      if (photos === null) {
        const galleryRes = await apiFetch(SM_ENDPOINTS.galleryGet(uid)).then(safeJson).catch(() => ({}));
        photos = Array.isArray(galleryRes) ? galleryRes : (galleryRes.photos || []);
      }
      return photos.slice(0, 4).map((p, i) => ({
        id: uid + '_' + i,
        name: profileInfo.name,
        username: profileInfo.username,
        avatar: profileInfo.photoURL || fallbackAvatar(profileInfo.name),
        image: typeof p === 'string' ? p : (p.url || p.imageUrl || ''),
        caption: '',
        likes: 0,
        time: ''
      }));
    }));

    const posts = [].concat(...results).filter((p) => p.image);
    feedStore.set({ loading: false, posts: posts });
  }

  function HomeScreen() {
    const feed = useStore(feedStore);
    const profile = useStore(profileStore);
    React.useEffect(() => { loadHomeFeed(); }, [profile.uid, (profile.followingIds || []).join(',')]);

    const stories = [{ id: 'me', name: 'Your Story', avatar: profile.photoURL || fallbackAvatar(profile.name), isMe: true }]
      .concat((profile.followingProfiles || []).slice(0, 10).map((p) => ({ id: p.uid, name: p.name, avatar: p.photoURL || fallbackAvatar(p.name) })));

    return e('div', { className: 'pb-32' },
      e('div', { className: 'flex gap-3 px-5 pt-1 pb-4 overflow-x-auto', style: { scrollbarWidth: 'none' } },
        stories.map((s) => e(StoryAvatar, {
          key: s.id, story: s,
          onClick: () => s.isMe ? document.getElementById('smGalleryUploadInput').click() : openProfile(s.id)
        }))
      ),
      e('div', { className: 'px-5 flex flex-col gap-4' },
        feed.loading
          ? e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, 'Loading feed...')
          : feed.posts.length === 0
            ? e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, 'Follow people to see their photos here.')
            : feed.posts.map((p) => e(PostCard, { key: p.id, post: p }))
      )
    );
  }

  /* ---------------- Discover (search + follow) — replaces the mock Explore grid, since there's no public photo feed API ---------------- */
  function DiscoverScreen() {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const profile = useStore(profileStore);
    const debounceRef = React.useRef(null);

    function runSearch(q) {
      setLoading(true);
      sbSearchUsers(q).then((direct) => {
        if (direct) { setResults(direct); return; }
        return apiFetch(SM_ENDPOINTS.search(q)).then(safeJson).then((data) => {
          const users = Array.isArray(data) ? data : (data.users || data.results || []);
          setResults(users);
        });
      }).catch((err) => { console.error('SocialMode search failed:', err); setResults([]); }).finally(() => setLoading(false));
    }

    function onQueryChange(v) {
      setQuery(v);
      clearTimeout(debounceRef.current);
      if (!v.trim()) { setResults([]); return; }
      debounceRef.current = setTimeout(() => runSearch(v.trim()), 400);
    }

    async function toggleFollow(u) {
      const uid = u.uid || u.id;
      const isFollowing = (profile.followingIds || []).includes(uid);
      try {
        await apiFetch(isFollowing ? SM_ENDPOINTS.unfollow() : SM_ENDPOINTS.follow(), {
          method: 'POST', body: JSON.stringify({ targetUserId: uid })
        });
        profileStore.set((s) => Object.assign({}, s, {
          followingIds: isFollowing ? s.followingIds.filter((x) => x !== uid) : s.followingIds.concat([uid]),
          following: s.following + (isFollowing ? -1 : 1)
        }));
      } catch (err) { /* keep UI as-is on failure */ }
    }

    return e('div', { className: 'px-5 pt-1 pb-32' },
      e('div', {
        className: 'flex items-center gap-2.5 px-4 mb-4',
        style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)', height: 48 }
      },
        e(Icon, { name: 'search', size: 17, color: 'var(--ink-soft)' }),
        e('input', {
          value: query, onChange: (ev) => onQueryChange(ev.target.value),
          placeholder: 'Search StudyBuddy', className: 'flex-1 bg-transparent outline-none text-sm h-full', style: { color: 'var(--ink)' }
        }),
        query && e('button', { onClick: () => onQueryChange(''), style: { border: 'none', background: 'transparent' } }, e(Icon, { name: 'x', size: 15, color: 'var(--ink-soft)' }))
      ),
      loading && e('p', { className: 'text-sm text-center py-6', style: { color: 'var(--ink-soft)' } }, 'Searching...'),
      !loading && query && results.length === 0 && e('p', { className: 'text-sm text-center py-6', style: { color: 'var(--ink-soft)' } }, 'No users found.'),
      !query && e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, 'Search for classmates to follow.'),
      e('div', { className: 'flex flex-col gap-2.5' }, results.map((u) => {
        const uid = u.uid || u.id;
        const isFollowing = (profile.followingIds || []).includes(uid);
        return e('div', {
          key: uid, className: 'flex items-center gap-3 px-3 py-2.5',
          style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }
        },
          e('button', {
            onClick: () => openProfile(uid),
            className: 'flex items-center gap-3 flex-1 min-w-0 transition-transform active:scale-[0.98]',
            style: { border: 'none', background: 'transparent', textAlign: 'left' }
          },
            e('img', { src: u.photoURL || u.photo_url || fallbackAvatar(u.name), className: 'w-12 h-12 rounded-full object-cover flex-shrink-0' }),
            e('div', { className: 'flex-1 min-w-0' },
              e('p', { className: 'text-sm font-semibold truncate', style: { color: 'var(--ink)' } }, u.name || 'Student'),
              e('p', { className: 'text-xs truncate', style: { color: 'var(--ink-soft)' } }, '@' + (u.username || u.sid || ''))
            )
          ),
          e('button', {
            onClick: () => toggleFollow(u),
            className: 'px-4 py-2 text-xs font-semibold flex-shrink-0 transition-transform active:scale-95',
            style: isFollowing
              ? { background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--ink)', borderRadius: 'var(--radius-sm)' }
              : { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', borderRadius: 'var(--radius-sm)', border: 'none', boxShadow: 'var(--shadow-pink)' }
          }, isFollowing ? 'Following' : 'Follow')
        );
      }))
    );
  }

  /* ---------------- Chat (Socket.io live + REST history) ---------------- */
  let socketRef = null;
  let socketReadyFlag = false;

  async function connectSocket() {
    if (socketRef && socketReadyFlag) return socketRef;
    const token = await getIdToken();
    if (!token) return null;
    uiStore.set((s) => Object.assign({}, s, { coldStartMsg: 'Connecting to Social Mode... (up to 15-50s on first load)' }));
    return new Promise((resolve) => {
      let socket;
      try { socket = io(BACKEND_URL, { auth: { token: token }, transports: ['websocket', 'polling'] }); }
      catch (err) { uiStore.set((s) => Object.assign({}, s, { coldStartMsg: null })); resolve(null); return; }
      const failSafe = setTimeout(() => { if (!socketReadyFlag) { uiStore.set((s) => Object.assign({}, s, { coldStartMsg: null })); resolve(socket); } }, 16000);
      socket.on('connect', () => {
        socketReadyFlag = true; socketRef = socket; clearTimeout(failSafe);
        uiStore.set((s) => Object.assign({}, s, { coldStartMsg: null }));
        resolve(socket);
      });
      socket.on('disconnect', () => { socketReadyFlag = false; });
      socket.on('receive_message', (msg) => {
        const cs = chatStore.get();
        if (cs.activeContact && msg.sender_id === cs.activeContact.uid) {
          chatStore.set((s) => Object.assign({}, s, { messages: s.messages.concat([msg]) }));
        }
      });
    });
  }

  async function loadChatContacts() {
    chatStore.set((s) => Object.assign({}, s, { loading: true }));
    const profile = profileStore.get();
    const ids = profile.followingIds || [];
    if (!ids.length) { chatStore.set((s) => Object.assign({}, s, { loading: false, contacts: [] })); return; }
    const profiles = await Promise.all(ids.map(fetchUserProfileById));
    chatStore.set((s) => Object.assign({}, s, { loading: false, contacts: profiles }));
  }

  function MessageOptionsSheet(props) {
    const msg = props.message;
    if (!msg) return null;
    const options = [
      { key: 'reply', label: 'Reply', icon: 'reply', action: () => props.onReply(msg) },
      { key: 'copy', label: 'Copy', icon: 'copy', action: () => props.onCopy(msg) },
      { key: 'pin', label: msg.pinned ? 'Unpin' : 'Pin (this session)', icon: 'pin', action: () => props.onPin(msg) },
      { key: 'delete', label: 'Remove from view', icon: 'trash', danger: true, action: () => props.onDelete(msg) }
    ];
    return e('div', { className: 'fixed inset-0 flex items-end justify-center', style: { zIndex: 80 }, onClick: props.onClose },
      e('div', { className: 'absolute inset-0', style: { background: 'rgba(58, 46, 63, 0.35)', animation: 'smFloatIn 0.2s ease-out' } }),
      e('div', { onClick: (ev) => ev.stopPropagation(), className: 'relative w-full max-w-md mx-auto px-4 pb-8', style: { animation: 'smFloatIn 0.25s ease-out' } },
        e('div', { style: { background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-nav)', overflow: 'hidden' } },
          e('div', { className: 'px-5 py-3', style: { borderBottom: '1px solid var(--glass-border)' } },
            e('p', { className: 'text-xs', style: { color: 'var(--ink-soft)' } }, msg.sender_id === profileStore.get().uid ? 'Your message' : 'Message'),
            e('p', { className: 'text-sm font-medium truncate mt-0.5', style: { color: 'var(--ink)' } }, msg.text)
          ),
          options.map((opt) => e('button', {
            key: opt.key, onClick: () => { opt.action(); props.onClose(); },
            className: 'w-full flex items-center gap-3 px-5 py-3.5 transition-colors active:opacity-60',
            style: { color: opt.danger ? '#E8478D' : 'var(--ink)', border: 'none', background: 'transparent' }
          }, e(Icon, { name: opt.icon, size: 18 }), e('span', { className: 'text-sm font-medium' }, opt.label)))
        ),
        e('button', {
          onClick: props.onClose, className: 'w-full mt-3 py-3.5 text-sm font-semibold transition-transform active:scale-95',
          style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--ink-soft)' }
        }, 'Cancel')
      )
    );
  }

  function ChatScreen(props) {
    const contact = props.contact;
    const chat = useStore(chatStore);
    const [draft, setDraft] = React.useState('');
    const [replyTo, setReplyTo] = React.useState(null);
    const [selected, setSelected] = React.useState(null);
    const myUid = profileStore.get().uid;

    React.useEffect(() => {
      let cancelled = false;
      (async () => {
        chatStore.set((s) => Object.assign({}, s, { messages: [], activeContact: contact }));
        await connectSocket();
        try {
          const res = await apiFetch(SM_ENDPOINTS.messages(contact.uid));
          const data = await safeJson(res);
          const msgs = Array.isArray(data) ? data : (data.messages || data.data || []);
          if (!cancelled) chatStore.set((s) => Object.assign({}, s, { messages: msgs }));
        } catch (err) { /* history unavailable, live chat still works */ }
      })();
      return () => { cancelled = true; };
    }, [contact.uid]);

    async function sendMessage() {
      const text = draft.trim();
      if (!text) return;
      const finalText = replyTo ? ('↪ ' + replyTo.text + '\n' + text) : text;
      const s = await connectSocket();
      if (s && socketReadyFlag) {
        s.emit('send_message', { receiverId: contact.uid, text: finalText });
        chatStore.set((st) => Object.assign({}, st, { messages: st.messages.concat([{ sender_id: myUid, receiver_id: contact.uid, text: finalText, timestamp: new Date().toISOString() }]) }));
        setDraft(''); setReplyTo(null);
      } else {
        showChatToast('Not connected — try again in a moment');
      }
    }
    function showChatToast(msg) {
      chatStore.set((s) => Object.assign({}, s, { toast: msg }));
      setTimeout(() => chatStore.set((s) => Object.assign({}, s, { toast: '' })), 1500);
    }

    const pinned = chat.messages.find((m) => m.pinned);

    return e('div', { className: 'flex flex-col', style: { height: 'calc(100vh - 150px)' } },
      e('div', { className: 'flex items-center gap-3 px-5 pb-3' },
        e('button', { onClick: props.onBack, className: 'w-9 h-9 flex items-center justify-center flex-shrink-0 transition-transform active:scale-90', style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' } }, e(Icon, { name: 'arrowLeft', size: 16, color: 'var(--ink)' })),
        e('div', { className: 'flex items-center gap-2.5' },
          e('img', { src: contact.photoURL || fallbackAvatar(contact.name), className: 'w-9 h-9 rounded-full object-cover', style: { border: '2px solid var(--primary)' } }),
          e('div', { className: 'text-left' },
            e('p', { className: 'text-sm font-semibold', style: { color: 'var(--ink)' } }, contact.name),
            e('p', { className: 'text-[11px]', style: { color: 'var(--ink-soft)' } }, '@' + (contact.username || ''))
          )
        )
      ),
      pinned && e('div', { className: 'mx-5 mb-2 px-3 py-2 flex items-center gap-2 text-xs', style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-soft)' } },
        e(Icon, { name: 'pin', size: 12, color: 'var(--primary-dark)' }), e('span', { className: 'truncate' }, pinned.text)
      ),
      e('div', { className: 'flex-1 overflow-y-auto px-5 pb-2 flex flex-col gap-2' },
        chat.messages.length === 0 && e('p', { className: 'text-sm text-center py-8', style: { color: 'var(--ink-soft)' } }, 'Say hi 👋'),
        chat.messages.map((m, i) => {
          const isMe = m.sender_id === myUid;
          return e('div', { key: i, className: 'flex flex-col', style: { alignItems: isMe ? 'flex-end' : 'flex-start' } },
            e('div', {
              onContextMenu: (ev) => { ev.preventDefault(); setSelected(m); },
              onClick: () => setSelected(m),
              className: 'max-w-[75%] px-4 py-2.5 select-none cursor-pointer transition-transform active:scale-[0.98]',
              style: {
                background: isMe ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--glass)',
                border: isMe ? 'none' : '1px solid var(--glass-border)', color: isMe ? '#fff' : 'var(--ink)',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', boxShadow: 'var(--shadow-soft)', whiteSpace: 'pre-wrap'
              }
            }, e('p', { className: 'text-sm leading-snug' }, m.text)),
            e('div', { className: 'flex items-center gap-1 mt-1 px-1 text-[10px]', style: { color: 'var(--ink-soft)' } },
              m.pinned && e(Icon, { name: 'pin', size: 9 }),
              e('span', null, timeAgo(m.timestamp) || ''),
              isMe && e(Icon, { name: 'checkCheck', size: 12, color: 'var(--accent)' })
            )
          );
        })
      ),
      replyTo && e('div', { className: 'mx-5 mb-1 px-3 py-2 flex items-center justify-between', style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' } },
        e('div', { className: 'flex items-center gap-2 min-w-0' }, e(Icon, { name: 'reply', size: 14, color: 'var(--primary-dark)' }), e('span', { className: 'text-xs truncate', style: { color: 'var(--ink-soft)' } }, replyTo.text)),
        e('button', { onClick: () => setReplyTo(null), style: { border: 'none', background: 'transparent' } }, e(Icon, { name: 'x', size: 14, color: 'var(--ink-soft)' }))
      ),
      e('div', { className: 'px-5 flex items-center gap-2', style: { paddingBottom: '64px' } },
        e('input', {
          value: draft, onChange: (ev) => setDraft(ev.target.value), onKeyDown: (ev) => ev.key === 'Enter' && sendMessage(),
          placeholder: 'Message likho...', className: 'flex-1 px-4 py-3 text-sm outline-none',
          style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--ink)' }
        }),
        e('button', { onClick: sendMessage, className: 'w-11 h-11 flex items-center justify-center flex-shrink-0 transition-transform active:scale-90', style: { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius: '50%', boxShadow: 'var(--shadow-pink)', border: 'none' } }, e(Icon, { name: 'send', size: 17, color: '#fff' }))
      ),
      chat.toast && e('div', { className: 'fixed left-1/2 px-4 py-2 text-xs font-medium text-white', style: { bottom: 110, transform: 'translateX(-50%)', background: 'var(--ink)', borderRadius: '999px', zIndex: 90, animation: 'smFloatIn 0.2s ease-out' } }, chat.toast),
      e(MessageOptionsSheet, {
        message: selected, onClose: () => setSelected(null),
        onReply: (m) => setReplyTo(m),
        onCopy: (m) => { if (navigator.clipboard) navigator.clipboard.writeText(m.text).catch(() => {}); showChatToast('Copied'); },
        onPin: (m) => { chatStore.set((s) => Object.assign({}, s, { messages: s.messages.map((x) => x === m ? Object.assign({}, x, { pinned: !x.pinned }) : x) })); },
        onDelete: (m) => { chatStore.set((s) => Object.assign({}, s, { messages: s.messages.filter((x) => x !== m) })); showChatToast('Removed from your view'); }
      })
    );
  }

  function ChatListScreen(props) {
    const chat = useStore(chatStore);
    React.useEffect(() => { loadChatContacts(); }, []);
    if (chat.loading) return e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, 'Loading chats...');
    if (!chat.contacts.length) return e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, 'Follow people to start chatting.');
    return e('div', { className: 'px-5 pt-1 pb-32 flex flex-col gap-2' }, chat.contacts.map((c) =>
      e('div', {
        key: c.uid,
        className: 'flex items-center gap-3 px-3 py-2.5',
        style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }
      },
        e('button', { onClick: () => openProfile(c.uid), style: { border: 'none', background: 'transparent', flexShrink: 0 } },
          e('img', { src: c.photoURL || fallbackAvatar(c.name), className: 'w-14 h-14 rounded-full object-cover', style: { border: '2px solid var(--secondary)' } })
        ),
        e('button', {
          onClick: () => props.onOpenChat(c), className: 'flex-1 min-w-0 text-left', style: { border: 'none', background: 'transparent' }
        },
          e('p', { className: 'text-sm font-semibold truncate', style: { color: 'var(--ink)' } }, c.name),
          e('p', { className: 'text-xs truncate', style: { color: 'var(--ink-soft)' } }, '@' + (c.username || '') + ' · Tap to open chat')
        )
      )
    ));
  }

  function ChatSection() {
    const [view, setView] = React.useState('list');
    const [contact, setContact] = React.useState(null);
    const openReq = useStore(chatOpenRequestStore);

    React.useEffect(() => {
      chatStore.set((s) => Object.assign({}, s, { inThread: false }));
    }, []);

    React.useEffect(() => {
      if (openReq.contact) {
        setContact(openReq.contact);
        setView('chat');
        chatStore.set((s) => Object.assign({}, s, { inThread: true }));
        chatOpenRequestStore.set({ contact: null });
      }
    }, [openReq.contact]);

    if (view === 'chat' && contact) {
      return e(ChatScreen, {
        contact: contact,
        onBack: () => {
          setView('list');
          chatStore.set((s) => Object.assign({}, s, { inThread: false, activeContact: null }));
        }
      });
    }
    return e(ChatListScreen, {
      onOpenChat: (c) => {
        setContact(c); setView('chat');
        chatStore.set((s) => Object.assign({}, s, { inThread: true }));
      }
    });
  }

  /* ---------------- Profile (own + others) ---------------- */
  async function loadViewedProfile(uid) {
    viewedProfileStore.set({ loading: true, uid: uid, name: '', username: '', photoURL: '', isPrivate: false, isFollowing: false, hasPendingRequest: false, followers: 0, following: 0 });
    const [info, followerIds, followingIds] = await Promise.all([
      fetchUserProfileById(uid),
      sbGetFollowerIds(uid).then((r) => r !== null ? r : apiFetch(SM_ENDPOINTS.followers(uid)).then(safeJson).then((d) => (Array.isArray(d) ? d : (d.followers || [])))).catch(() => []),
      sbGetFollowingIds(uid).then((r) => r !== null ? r : apiFetch(SM_ENDPOINTS.following(uid)).then(safeJson).then((d) => (Array.isArray(d) ? d : (d.following || [])))).catch(() => [])
    ]);
    viewedProfileStore.set({
      loading: false, uid: uid, name: info.name, username: info.username, photoURL: info.photoURL,
      isPrivate: info.isPrivate, isFollowing: info.isFollowing, hasPendingRequest: info.hasPendingRequest,
      followers: followerIds.length, following: followingIds.length
    });
  }

  async function loadViewedGallery(uid) {
    viewedGalleryStore.set((s) => Object.assign({}, s, { loading: true, locked: false }));
    const direct = await sbGetGallery(uid).catch(() => null);
    if (direct !== null) { viewedGalleryStore.set({ loading: false, photos: direct, locked: false }); return; }
    try {
      const res = await apiFetch(SM_ENDPOINTS.galleryGet(uid));
      if (res.status === 403) { viewedGalleryStore.set({ loading: false, photos: [], locked: true }); return; }
      const data = await safeJson(res);
      const photos = Array.isArray(data) ? data : (data.photos || []);
      viewedGalleryStore.set({ loading: false, photos: photos.map((p) => typeof p === 'string' ? p : (p.url || p.imageUrl || '')), locked: false });
    } catch (err) {
      viewedGalleryStore.set({ loading: false, photos: [], locked: false });
    }
  }

  function openProfile(uid) {
    if (uid === profileStore.get().uid) {
      uiStore.set((s) => Object.assign({}, s, { tab: 'profile', viewUid: null }));
      return;
    }
    uiStore.set((s) => Object.assign({}, s, { tab: 'profile', viewUid: uid }));
    loadViewedProfile(uid);
    loadViewedGallery(uid);
  }

  async function openFollowList(uid, mode) {
    followListStore.set({ open: true, mode: mode, uid: uid, loading: true, users: [] });
    const idsPromise = mode === 'followers' ? sbGetFollowerIds(uid) : sbGetFollowingIds(uid);
    let ids = await idsPromise.catch(() => null);
    if (ids === null) {
      const res = await apiFetch(mode === 'followers' ? SM_ENDPOINTS.followers(uid) : SM_ENDPOINTS.following(uid)).then(safeJson).catch(() => ({}));
      ids = mode === 'followers' ? (res.followers || []) : (res.following || []);
    }
    const users = await Promise.all(ids.slice(0, 100).map(fetchUserProfileById));
    followListStore.set((s) => Object.assign({}, s, { loading: false, users: users }));
  }

  function closeFollowList() { followListStore.set((s) => Object.assign({}, s, { open: false })); }

  function FollowListSheet() {
    const fl = useStore(followListStore);
    if (!fl.open) return null;
    return e('div', { className: 'fixed inset-0 flex items-end justify-center', style: { zIndex: 85 }, onClick: closeFollowList },
      e('div', { className: 'absolute inset-0', style: { background: 'rgba(58, 46, 63, 0.35)', animation: 'smFloatIn 0.2s ease-out' } }),
      e('div', {
        onClick: (ev) => ev.stopPropagation(), className: 'relative w-full max-w-md mx-auto px-4 pb-6',
        style: { animation: 'smFloatIn 0.25s ease-out' }
      },
        e('div', {
          style: { background: 'var(--bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-nav)', overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }
        },
          e('div', { className: 'flex items-center justify-between px-5 py-3.5', style: { borderBottom: '1px solid var(--glass-border)' } },
            e('p', { className: 'text-sm font-bold', style: { color: 'var(--ink)' } }, fl.mode === 'followers' ? 'Followers' : 'Following'),
            e('button', { onClick: closeFollowList, style: { border: 'none', background: 'transparent' } }, e(Icon, { name: 'x', size: 16, color: 'var(--ink-soft)' }))
          ),
          e('div', { className: 'overflow-y-auto px-4 py-2 flex flex-col gap-2' },
            fl.loading
              ? e('p', { className: 'text-sm text-center py-8', style: { color: 'var(--ink-soft)' } }, 'Loading...')
              : fl.users.length === 0
                ? e('p', { className: 'text-sm text-center py-8', style: { color: 'var(--ink-soft)' } }, 'Nobody here yet.')
                : fl.users.map((u) => e('button', {
                    key: u.uid,
                    onClick: () => { closeFollowList(); openProfile(u.uid); },
                    className: 'w-full flex items-center gap-3 px-2 py-2 transition-transform active:scale-[0.98]',
                    style: { border: 'none', background: 'transparent', textAlign: 'left' }
                  },
                    e('img', { src: u.photoURL || fallbackAvatar(u.name), className: 'w-11 h-11 rounded-full object-cover flex-shrink-0' }),
                    e('div', { className: 'min-w-0' },
                      e('p', { className: 'text-sm font-semibold truncate', style: { color: 'var(--ink)' } }, u.name),
                      e('p', { className: 'text-xs truncate', style: { color: 'var(--ink-soft)' } }, '@' + (u.username || ''))
                    )
                  ))
          )
        )
      )
    );
  }

  async function loadGallery() {
    const profile = profileStore.get();
    if (!profile.uid) return;
    galleryStore.set((s) => Object.assign({}, s, { loading: true }));
    const direct = await sbGetGallery(profile.uid).catch(() => null);
    if (direct !== null) { galleryStore.set({ loading: false, photos: direct }); return; }
    try {
      const res = await apiFetch(SM_ENDPOINTS.galleryGet(profile.uid));
      const data = await safeJson(res);
      const photos = Array.isArray(data) ? data : (data.photos || []);
      galleryStore.set({ loading: false, photos: photos.map((p) => typeof p === 'string' ? p : (p.url || p.imageUrl || '')) });
    } catch (err) {
      galleryStore.set({ loading: false, photos: [] });
    }
  }

  function ProfileScreen() {
    const ui = useStore(uiStore);
    const profile = useStore(profileStore);
    const gallery = useStore(galleryStore);
    const viewedProfile = useStore(viewedProfileStore);
    const viewedGallery = useStore(viewedGalleryStore);

    const isOtherUser = !!ui.viewUid && ui.viewUid !== profile.uid;
    const shown = isOtherUser ? viewedProfile : { loading: false, uid: profile.uid, name: profile.name, username: profile.username, photoURL: profile.photoURL, isPrivate: profile.isPrivate, followers: profile.followers, following: profile.following };
    const shownGallery = isOtherUser ? viewedGallery : gallery;
    const isFollowing = isOtherUser && (profile.followingIds || []).includes(ui.viewUid);
    // 'following' (accepted) | 'requested' (pending, sent by me) | 'none'
    const followState = isFollowing ? 'following' : (isOtherUser && viewedProfile.hasPendingRequest ? 'requested' : 'none');
    const canSeePrivateContent = !isOtherUser || !shown.isPrivate || followState === 'following';

    React.useEffect(() => {
      if (isOtherUser) { loadViewedProfile(ui.viewUid); loadViewedGallery(ui.viewUid); }
      else { loadGallery(); }
    }, [ui.viewUid, profile.uid]);

    async function toggleFollowHere() {
      const uid = ui.viewUid;
      if (followState === 'following') {
        try {
          await apiFetch(SM_ENDPOINTS.unfollow(), { method: 'POST', body: JSON.stringify({ targetUserId: uid }) });
          profileStore.set((s) => Object.assign({}, s, { followingIds: s.followingIds.filter((x) => x !== uid), following: Math.max(0, s.following - 1) }));
          viewedProfileStore.set((s) => Object.assign({}, s, { followers: Math.max(0, s.followers - 1) }));
        } catch (err) {}
        return;
      }
      if (followState === 'requested') {
        try {
          await apiFetch(SM_ENDPOINTS.cancelFollowRequest(uid), { method: 'POST' });
          viewedProfileStore.set((s) => Object.assign({}, s, { hasPendingRequest: false }));
        } catch (err) {}
        return;
      }
      try {
        const res = await apiFetch(SM_ENDPOINTS.follow(), { method: 'POST', body: JSON.stringify({ targetUserId: uid }) });
        const data = await safeJson(res);
        if (data && data.requested) {
          viewedProfileStore.set((s) => Object.assign({}, s, { hasPendingRequest: true }));
          return;
        }
        profileStore.set((s) => Object.assign({}, s, { followingIds: s.followingIds.concat([uid]), following: s.following + 1 }));
        viewedProfileStore.set((s) => Object.assign({}, s, { followers: s.followers + 1 }));
      } catch (err) {}
    }

    function messageThisUser() {
      chatOpenRequestStore.set({ contact: { uid: shown.uid, name: shown.name, username: shown.username, photoURL: shown.photoURL } });
      uiStore.set((s) => Object.assign({}, s, { tab: 'chat', viewUid: null }));
    }

    if (shown.loading) return e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, 'Loading profile...');

    const followBtnLabel = followState === 'following' ? 'Following' : (followState === 'requested' ? 'Requested' : 'Follow');
    const followBtnStyle = followState === 'none'
      ? { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', borderRadius: 'var(--radius-sm)', border: 'none', boxShadow: 'var(--shadow-pink)' }
      : { background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--ink)', borderRadius: 'var(--radius-sm)' };

    return e('div', { className: 'px-5 pt-1 pb-32' },
      isOtherUser && e('button', {
        onClick: () => uiStore.set((s) => Object.assign({}, s, { viewUid: null })),
        className: 'flex items-center gap-1.5 mb-3 transition-transform active:scale-95',
        style: { border: 'none', background: 'transparent', color: 'var(--ink-soft)' }
      }, e(Icon, { name: 'arrowLeft', size: 15 }), e('span', { className: 'text-xs font-medium' }, 'Back')),
      e(GlassCard, { style: { padding: '22px' } },
        e('div', { className: 'flex items-center gap-4' },
          e('div', { className: 'relative' },
            e('img', {
              src: (!isOtherUser || canSeePrivateContent) ? (shown.photoURL || fallbackAvatar(shown.name)) : fallbackAvatar(shown.name),
              className: 'w-20 h-20 rounded-full object-cover' + (isOtherUser && canSeePrivateContent && shown.photoURL ? ' cursor-pointer' : ''),
              style: { border: '3px solid var(--secondary)' },
              onClick: (isOtherUser && canSeePrivateContent) ? () => openPhotoLightbox(shown.photoURL, shown.name) : undefined
            }),
            !isOtherUser && e('button', {
              onClick: () => document.getElementById('smAvatarUploadInput').click(),
              className: 'absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center',
              style: { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: '2px solid var(--bg)' }
            }, e(Icon, { name: 'camera', size: 12, color: '#fff' }))
          ),
          e('div', { className: 'flex-1 flex justify-around text-center' },
            e('div', null, e('p', { className: 'text-base font-bold', style: { color: 'var(--ink)' } }, canSeePrivateContent ? shownGallery.photos.length : '–'), e('p', { className: 'text-[11px]', style: { color: 'var(--ink-soft)' } }, 'Posts')),
            e('button', { onClick: () => openFollowList(shown.uid, 'followers'), style: { border: 'none', background: 'transparent' } },
              e('p', { className: 'text-base font-bold', style: { color: 'var(--ink)' } }, shown.followers), e('p', { className: 'text-[11px]', style: { color: 'var(--ink-soft)' } }, 'Followers')),
            e('button', { onClick: () => openFollowList(shown.uid, 'following'), style: { border: 'none', background: 'transparent' } },
              e('p', { className: 'text-base font-bold', style: { color: 'var(--ink)' } }, shown.following), e('p', { className: 'text-[11px]', style: { color: 'var(--ink-soft)' } }, 'Following'))
          )
        ),
        e('div', { className: 'flex items-center gap-1.5 mt-4' },
          e('p', { className: 'font-semibold text-sm', style: { color: 'var(--ink)' } }, shown.name || '—'),
          shown.isPrivate && e(Icon, { name: 'settings', size: 12, color: 'var(--ink-soft)' })
        ),
        e('p', { className: 'text-xs', style: { color: 'var(--ink-soft)' } }, shown.username ? '@' + shown.username : ''),
        !isOtherUser && e('div', { className: 'flex items-center justify-between mt-4 px-0.5' },
          e('div', null,
            e('p', { className: 'text-xs font-semibold', style: { color: 'var(--ink)' } }, 'Private Account'),
            e('p', { className: 'text-[11px] mt-0.5', style: { color: 'var(--ink-soft)' } }, profile.isPrivate ? 'Approval needed before someone can follow you.' : 'Anyone can follow you directly.')
          ),
          e('button', {
            onClick: togglePrivacy,
            className: 'transition-all',
            style: { width: 44, height: 26, borderRadius: 999, border: 'none', padding: 3, flexShrink: 0, background: profile.isPrivate ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--glass-border)', display: 'flex', justifyContent: profile.isPrivate ? 'flex-end' : 'flex-start' }
          }, e('div', { style: { width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' } }))
        ),
        e('div', { className: 'flex gap-2 mt-4' },
          isOtherUser
            ? [
                e('button', {
                  key: 'follow', onClick: toggleFollowHere,
                  className: 'flex-1 py-2.5 text-sm font-semibold transition-transform active:scale-95',
                  style: followBtnStyle
                }, followBtnLabel),
                e('button', {
                  key: 'msg', onClick: messageThisUser, disabled: !canSeePrivateContent,
                  className: 'flex-1 py-2.5 text-sm font-semibold transition-transform active:scale-95',
                  style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--ink)', borderRadius: 'var(--radius-sm)', opacity: canSeePrivateContent ? 1 : 0.5 }
                }, 'Message')
              ]
            : e('div', { className: 'flex-1 flex gap-2' },
                e('button', {
                  onClick: () => document.getElementById('smAvatarUploadInput').click(),
                  className: 'flex-1 py-2.5 text-sm font-semibold transition-transform active:scale-95',
                  style: { background: 'var(--glass)', color: 'var(--ink)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }
                }, e(Icon, { name: 'camera', size: 14 }), ' Change Photo'),
                e('button', {
                  onClick: () => document.getElementById('smGalleryUploadInput').click(),
                  className: 'flex-1 py-2.5 text-sm font-semibold transition-transform active:scale-95',
                  style: { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-pink)', border: 'none' }
                }, e(Icon, { name: 'plus', size: 14, color: '#fff' }), ' Add to Gallery')
              )
        )
      ),
      e('div', { className: 'flex mt-5 mb-3', style: { borderBottom: '1px solid var(--glass-border)' } },
        e('button', { className: 'flex-1 flex items-center justify-center gap-1.5 py-2.5', style: { borderBottom: '2px solid var(--primary)', border: 'none', background: 'transparent' } },
          e(Icon, { name: 'grid', size: 16, color: 'var(--primary-dark)' }),
          e('span', { className: 'text-xs font-medium', style: { color: 'var(--primary-dark)' } }, 'Gallery')
        )
      ),
      !canSeePrivateContent
        ? e('div', { className: 'text-center py-12 px-6' },
            e(Icon, { name: 'user', size: 30, color: 'var(--ink-soft)' }),
            e('p', { className: 'text-sm font-semibold mt-3', style: { color: 'var(--ink)' } }, 'This account is private'),
            e('p', { className: 'text-xs mt-1', style: { color: 'var(--ink-soft)' } }, followState === 'requested' ? 'Your follow request is pending approval.' : 'Follow this account to see their photos.')
          )
        : shownGallery.loading
          ? e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, 'Loading gallery...')
          : shownGallery.photos.length === 0
            ? e('p', { className: 'text-sm text-center py-10', style: { color: 'var(--ink-soft)' } }, isOtherUser ? 'No photos yet.' : 'No photos yet. Open Profile and tap Add to Gallery.')
            : e('div', { className: 'grid grid-cols-3 gap-1.5' }, shownGallery.photos.map((src, i) =>
                e('div', { key: i, className: 'aspect-square overflow-hidden relative', style: { borderRadius: 'var(--radius-sm)', background: '#000' } },
                  isVideoUrl(src)
                    ? [
                        e('video', { key: 'v', src: src, className: 'w-full h-full object-cover', muted: true, playsInline: true }),
                        e('div', { key: 'p', className: 'absolute inset-0 flex items-center justify-center', style: { pointerEvents: 'none' } }, e(Icon, { name: 'playCircle', size: 22, color: '#fff', fill: 'rgba(0,0,0,0.35)' }))
                      ]
                    : e('img', { src: src, alt: '', className: 'w-full h-full object-cover' })
                )
              ))
    );
  }

  /* ---------------- gallery / avatar upload wiring (reuses host page's resize pipeline when available) ---------------- */
  function fileToBase64(file, cb) {
    // The host page's resize pipeline is built for photos only (canvas resize) — never
    // run video files through it, just read them as-is.
    if (!file.type.startsWith('video/') && typeof window.resizeImageFileToBase64 === 'function') {
      window.resizeImageFileToBase64(file, cb);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
  }

  const GALLERY_MAX_BYTES = 20 * 1024 * 1024; // keep in sync with the backend's cap

  function onGalleryFileChosen(evt) {
    const file = evt.target.files && evt.target.files[0];
    evt.target.value = '';
    if (!file) return;
    if (file.size > GALLERY_MAX_BYTES) {
      alert('File too large — please choose something under 20MB.');
      return;
    }
    fileToBase64(file, (base64) => {
      apiFetch(SM_ENDPOINTS.galleryAdd(), { method: 'POST', body: JSON.stringify({ imageBase64: base64 }) })
        .then(async (res) => {
          if (!res.ok) {
            const body = await safeJson(res);
            throw new Error((body && body.message) ? `${body.message} (HTTP ${res.status})` : `HTTP ${res.status}`);
          }
          loadGallery();
          loadHomeFeed();
        })
        .catch((err) => { alert('Upload failed: ' + (err && err.message ? err.message : 'please try again.')); });
    });
  }

  function onAvatarFileChosen(evt) {
    const file = evt.target.files && evt.target.files[0];
    evt.target.value = '';
    if (!file) return;
    if (typeof window.resizeImageFileToBase64 === 'function' && typeof window.uploadProfilePhotoToBackend === 'function') {
      window.resizeImageFileToBase64(file, (base64) => { window.uploadProfilePhotoToBackend(base64, { onSuccess: () => {} }); });
      return;
    }
    fileToBase64(file, (base64) => {
      apiFetch(SM_ENDPOINTS.sync(), { method: 'POST', body: JSON.stringify({ photoURL: base64 }) })
        .then(() => profileStore.set((s) => Object.assign({}, s, { photoURL: base64 })))
        .catch(() => {});
    });
  }

  /* ---------------- profile bootstrap ---------------- */
  // NOTE: social-mode is opened via a full page navigation
  // (window.location.href = 'social-mode?...') from fy / second-year /
  // third-year — NOT an iframe — so any `window.currentUserName` / `window._userSid`
  // set on the host page never survives that navigation; this is a fresh JS context and
  // those globals are always undefined here. Relying on them silently fell through to
  // Supabase Auth's displayName (usually unset) or the user's email prefix, which is why
  // the email ID was showing up as the display name. Same story for the profile photo —
  // Supabase Auth's `user.photoURL` is normally empty (students upload a photo into RTDB,
  // not into their Supabase Auth account), and the `window.socialSyncToBackend` bridge
  // fy tries to call never exists here for the same cross-page-navigation reason, so
  // it silently no-ops. Fetch name + SID + photo directly from RTDB `users/` (keyed by
  // uid) — the same authoritative source fy itself uses — instead of any of that.
  async function fetchRealProfileFromRTDB(uid, fallbackEmail) {
    try {
      const snap = await SBZLegacy.database().ref('users').orderByChild('uid').equalTo(uid).once('value');
      if (snap.exists()) {
        const key = Object.keys(snap.val())[0];
        const userData = snap.val()[key] || {};
        return {
          name: userData.name || (fallbackEmail ? fallbackEmail.split('@')[0] : 'Student'),
          sid: userData.sid || null,
          photoURL: userData.photoURL || userData.photo_url || null
        };
      }
    } catch (err) { console.warn('SocialMode: RTDB profile lookup failed, falling back', err); }
    return { name: null, sid: null, photoURL: null };
  }

  async function bootstrapProfile() {
    const user = getSessionUser();
    if (!user) return;

    const real = await fetchRealProfileFromRTDB(user.uid, user.email);
    const name = real.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Student');
    const username = real.sid || window._userSid || window.currentUserSid || null; // S ID is the ONLY public username
    const photoURL = real.photoURL || user.photoURL || '';

    profileStore.set((s) => Object.assign({}, s, { uid: user.uid, name: name, username: username || s.username || '', photoURL: photoURL || s.photoURL }));

    try {
      const payload = { uid: user.uid, name: name, email: user.email || '' };
      if (username) payload.username = username; // don't overwrite existing username with blank if S ID isn't set yet
      if (photoURL) payload.photoURL = photoURL; // keep any existing Supabase photo if RTDB/Auth don't have one yet
      const syncRes = await apiFetch(SM_ENDPOINTS.sync(), { method: 'POST', body: JSON.stringify(payload) });
      if (!syncRes.ok) {
        const body = await safeJson(syncRes);
        console.error('SocialMode: profile sync failed', syncRes.status, body);
      }
    } catch (err) { console.error('SocialMode: profile sync request failed', err); }

    // Pick up the account's own privacy flag (Supabase-only field, not stored in Supabase RTDB)
    try {
      const selfRes = await apiFetch(SM_ENDPOINTS.userProfile(user.uid));
      const selfData = await safeJson(selfRes);
      const selfUser = selfData.user || selfData;
      profileStore.set((s) => Object.assign({}, s, { isPrivate: !!selfUser.is_private }));
    } catch (err) { /* non-fatal — defaults to public */ }

    loadNotifications();

    try {
      let followersArr = await sbGetFollowerIds(user.uid);
      let followingIds = await sbGetFollowingIds(user.uid);
      if (followersArr === null || followingIds === null) {
        const [fRes, gRes] = await Promise.all([apiFetch(SM_ENDPOINTS.followers(user.uid)), apiFetch(SM_ENDPOINTS.following(user.uid))]);
        const followers = await safeJson(fRes), following = await safeJson(gRes);
        followersArr = Array.isArray(followers) ? followers : (followers.followers || followers.data || []);
        const followingArrRaw = Array.isArray(following) ? following : (following.following || following.data || []);
        followingIds = followingArrRaw.map((u) => u.uid || u.id || u);
      }
      profileStore.set((s) => Object.assign({}, s, { followers: followersArr.length, following: followingIds.length, followingIds: followingIds }));
    } catch (err) {}
  }

  // Toggles the logged-in user's own private-account flag. Optimistic update with
  // rollback on failure so the switch never gets stuck showing the wrong state.
  async function togglePrivacy() {
    const next = !profileStore.get().isPrivate;
    profileStore.set((s) => Object.assign({}, s, { isPrivate: next }));
    try {
      const res = await apiFetch(SM_ENDPOINTS.sync(), { method: 'POST', body: JSON.stringify({ isPrivate: next }) });
      if (!res.ok) throw new Error('privacy sync failed');
    } catch (err) {
      profileStore.set((s) => Object.assign({}, s, { isPrivate: !next }));
    }
  }

  /* ---------------- Notifications (follow requests + accept confirmations) ---------------- */
  async function loadNotifications() {
    notificationsStore.set((s) => Object.assign({}, s, { loading: true }));
    const noticeUnread = adminNoticeStore.get().unread;
    try {
      const res = await apiFetch(SM_ENDPOINTS.notifications());
      const data = await safeJson(res);
      const socialUnread = data.unreadCount || 0;
      notificationsStore.set((s) => Object.assign({}, s, {
        loading: false, items: data.notifications || [], socialUnread,
        unreadCount: socialUnread + noticeUnread
      }));
    } catch (err) {
      notificationsStore.set((s) => Object.assign({}, s, { loading: false, unreadCount: noticeUnread }));
    }
  }

  function openNotificationsSheet() {
    notificationsStore.set((s) => Object.assign({}, s, { open: true }));
    refreshPushPermissionState();
    loadNotifications().then(() => {
      apiFetch(SM_ENDPOINTS.notificationsMarkRead(), { method: 'POST' })
        .then(() => notificationsStore.set((s) => Object.assign({}, s, { socialUnread: 0, unreadCount: adminNoticeStore.get().unread })))
        .catch(() => {});
    });
  }
  function closeNotificationsSheet() { notificationsStore.set((s) => Object.assign({}, s, { open: false })); }

  async function respondToFollowRequest(requesterUid, action) {
    try {
      await apiFetch(
        action === 'accept' ? SM_ENDPOINTS.acceptFollowRequest(requesterUid) : SM_ENDPOINTS.rejectFollowRequest(requesterUid),
        { method: 'POST' }
      );
      if (action === 'accept') profileStore.set((s) => Object.assign({}, s, { followers: s.followers + 1 }));
      loadNotifications();
    } catch (err) {}
  }

  function NotificationsSheet() {
    const nf = useStore(notificationsStore);
    const pp = useStore(pushPermissionStore);
    if (!nf.open) return null;
    return e('div', { className: 'fixed inset-0 flex items-end justify-center', style: { zIndex: 90 }, onClick: closeNotificationsSheet },
      e('div', { className: 'absolute inset-0', style: { background: 'rgba(58, 46, 63, 0.35)', animation: 'smFloatIn 0.2s ease-out' } }),
      e('div', {
        onClick: (ev) => ev.stopPropagation(), className: 'relative w-full max-w-md mx-auto px-4 pb-6',
        style: { animation: 'smFloatIn 0.25s ease-out' }
      },
        e('div', {
          style: { background: 'var(--bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-nav)', overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }
        },
          e('div', { className: 'flex items-center justify-between px-5 py-3.5', style: { borderBottom: '1px solid var(--glass-border)' } },
            e('p', { className: 'text-sm font-bold', style: { color: 'var(--ink)' } }, 'Notifications'),
            e('div', { className: 'flex items-center gap-3' },
              e('button', { onClick: markAllNoticesRead, style: { border: 'none', background: 'transparent', color: '#ff6f9c', fontSize: 11, fontWeight: 700 } }, 'Mark all read'),
              e('button', { onClick: closeNotificationsSheet, style: { border: 'none', background: 'transparent' } }, e(Icon, { name: 'x', size: 16, color: 'var(--ink-soft)' }))
            )
          ),
          e('div', { className: 'overflow-y-auto px-4 py-2 flex flex-col gap-1' },
            (pp.perm === 'granted' || pp.perm === 'unsupported') ? null :
              pp.perm === 'denied'
                ? e('p', { style: { fontSize: 11, color: 'var(--ink-soft)', padding: '0 4px 10px' } }, '🔕 Notifications are blocked in your browser. Enable them from site settings to get notices when you are offline.')
                : e('button', {
                    onClick: requestPushPermission,
                    style: { width: '100%', padding: 8, border: 'none', borderRadius: 8, background: '#ff6f9c', color: '#fff', fontSize: 11.5, fontWeight: 700, marginBottom: 10, cursor: 'pointer' }
                  }, '🔔 Enable notifications for offline updates'),
            adminNoticesList.map(renderAdminNoticeRow),
            nf.loading
              ? e('p', { className: 'text-sm text-center py-8', style: { color: 'var(--ink-soft)' } }, 'Loading...')
              : nf.items.length === 0 && adminNoticesList.length === 0
                ? e('p', { className: 'text-sm text-center py-8', style: { color: 'var(--ink-soft)' } }, 'No notifications yet.')
                : nf.items.map((n) => e('div', {
                    key: n.id, className: 'flex items-center gap-3 px-2 py-2.5', style: { borderBottom: '1px solid var(--glass-border)' }
                  },
                    e('div', {
                      className: 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      style: { background: 'var(--glass)', border: '1px solid var(--glass-border)' }
                    }, e(Icon, { name: n.type === 'follow_request' ? 'user' : 'checkCheck', size: 16, color: 'var(--primary-dark)' })),
                    e('div', { className: 'flex-1 min-w-0' },
                      e('p', { className: 'text-xs', style: { color: 'var(--ink)' } },
                        e('span', { className: 'font-semibold' }, n.from_name || 'Student'),
                        n.from_username ? ' @' + n.from_username : '',
                        ' ',
                        n.type === 'follow_request' ? 'wants to follow you' : 'accepted your follow request'
                      ),
                      e('p', { className: 'text-[10px] mt-0.5', style: { color: 'var(--ink-soft)' } }, timeAgo(n.created_at))
                    ),
                    n.type === 'follow_request' && n.requestStatus === 'pending' && e('div', { className: 'flex gap-1.5 flex-shrink-0' },
                      e('button', {
                        onClick: () => respondToFollowRequest(n.from_uid, 'accept'),
                        className: 'px-2.5 py-1.5 text-[11px] font-semibold transition-transform active:scale-95',
                        style: { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', border: 'none', borderRadius: 8 }
                      }, 'Accept'),
                      e('button', {
                        onClick: () => respondToFollowRequest(n.from_uid, 'reject'),
                        className: 'px-2.5 py-1.5 text-[11px] font-semibold transition-transform active:scale-95',
                        style: { background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--ink)', borderRadius: 8 }
                      }, 'Reject')
                    ),
                    n.type === 'follow_request' && n.requestStatus !== 'pending' && e('span', {
                      className: 'text-[10px] flex-shrink-0', style: { color: 'var(--ink-soft)' }
                    }, n.requestStatus === 'accepted' ? 'Accepted' : 'Rejected')
                  ))
          )
        )
      )
    );
  }

  /* ---------------- App root ---------------- */
  function App() {
    const ui = useStore(uiStore);
    React.useEffect(() => { if (ui.open) bootstrapProfile(); }, [ui.open]);

    const titles = { home: 'Home', discover: 'Discover', chat: 'Chat', profile: 'Profile' };

    return e('div', { className: 'sm-app-bg' + (ui.dark ? ' sm-dark' : ''), style: { position: 'relative' } },
      ui.coldStartMsg && e('div', {
        style: { position: 'absolute', inset: 0, background: 'var(--bg)', zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }
      },
        e('div', { style: { width: 42, height: 42, borderRadius: '50%', border: '3px solid rgba(255,143,191,0.25)', borderTopColor: 'var(--primary)', animation: 'smPop 1s ease-in-out infinite' } }),
        e('span', { style: { fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 } }, ui.coldStartMsg)
      ),
      e('div', { className: 'max-w-md mx-auto relative', style: { minHeight: '100vh' } },
        e(TopBar, { title: titles[ui.tab] || 'Social' }),
        ui.tab === 'home' && e(HomeScreen),
        ui.tab === 'discover' && e(DiscoverScreen),
        ui.tab === 'chat' && e(ChatSection),
        ui.tab === 'profile' && e(ProfileScreen),
        e(FloatingNav),
        e(FollowListSheet),
        e(NotificationsSheet),
        e(PhotoLightbox),
        e('input', { type: 'file', id: 'smGalleryUploadInput', accept: 'image/*,video/*', style: { display: 'none' }, onChange: onGalleryFileChosen }),
        e('input', { type: 'file', id: 'smAvatarUploadInput', accept: 'image/*', style: { display: 'none' }, onChange: onAvatarFileChosen })
      )
    );
  }

  /* ---------------- mount + public API ---------------- */
  let reactMounted = false;
  function mountIfNeeded() {
    if (reactMounted) return;
    const root = document.getElementById('smReactRoot');
    ReactDOM.createRoot(root).render(e(App));
    reactMounted = true;
  }

  // Public API so the plain bottom-nav "Notifications" button (admin-only,
  // no Social Mode required) can read/act on admin notices too.
  window.AdminNotices = {
    getList: () => adminNoticesList,
    getUnreadCount: () => adminNoticeStore.get().unread,
    subscribe: (cb) => adminNoticeStore.subscribe(cb),
    refresh: fetchAdminNotices,
    markRead: markNoticeRead,
    markAllRead: markAllNoticesRead,
    start: startAdminNoticeListeners,
    stop: stopAdminNoticeListeners,
    timeAgo: timeAgo
  };

  window.SocialMode = {
    // On the standalone page, Social Mode IS the whole page — "open" just
    // means mount + show (called automatically once auth resolves, see the
    // page shell below), and "close" means go back to the dashboard the
    // user came from, via a real navigation so that dashboard gets its own
    // normal loading transition again (same as any fresh page load).
    open: function () {
      mountIfNeeded();
      document.getElementById('smReactRoot').classList.add('active');
      uiStore.set((s) => Object.assign({}, s, { open: true }));
    },
    openNotifications: function () {
      mountIfNeeded();
      document.getElementById('smReactRoot').classList.add('active');
      uiStore.set((s) => Object.assign({}, s, { open: true }));
      notificationsStore.set((s) => Object.assign({}, s, { open: true }));
      if (typeof loadNotifications === 'function') loadNotifications();
    },
    close: function () {
      window.location.href = window.SM_RETURN_URL || 'fy';
    },
    syncPhotoFromHost: function (photoURL) {
      if (!photoURL) return;
      profileStore.set((s) => Object.assign({}, s, { photoURL: photoURL }));
      apiFetch(SM_ENDPOINTS.sync(), { method: 'POST', body: JSON.stringify({ photoURL: photoURL }) })
        .then(async (res) => { if (!res.ok) console.error('SocialMode: photo sync to Supabase failed', res.status, await safeJson(res)); })
        .catch((err) => console.error('SocialMode: photo sync request failed', err));
    },
    syncUsernameFromHost: function (sid) {
      if (!sid) return;
      profileStore.set((s) => Object.assign({}, s, { username: sid }));
      apiFetch(SM_ENDPOINTS.sync(), { method: 'POST', body: JSON.stringify({ username: sid }) })
        .then(async (res) => { if (!res.ok) console.error('SocialMode: SID sync to Supabase failed', res.status, await safeJson(res)); })
        .catch((err) => console.error('SocialMode: SID sync request failed', err));
    }
  };
})();
