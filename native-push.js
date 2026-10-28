// native-push.js — Android APK (Capacitor) notification permission + FCM token registration.
// Loaded by fy / second-year / third-year / social-mode. Does nothing in a normal browser
// (browsers keep using Web Push via /push-sw.js).
//
// Why this exists: inside the APK the page is a remote site in a WebView. Notification.requestPermission()
// does nothing there, and the old flow skipped the prompt whenever the server already had ANY push
// subscription for the account (e.g. enabled once in Chrome). The OS permission is per-device, so for
// the app we decide only from the device's own permission state.
(function () {
  'use strict';
  var W = window;
  var inflight = null;
  var wired = false;
  var sendTokenFn = null;
  var promptedThisSession = false;

  function isNative() {
    try { return !!(W.Capacitor && W.Capacitor.isNativePlatform && W.Capacitor.isNativePlatform()); } catch (e) { return false; }
  }

  function plugin() {
    try {
      var C = W.Capacitor;
      if (!C) return null;
      if (C.Plugins && C.Plugins.PushNotifications) return C.Plugins.PushNotifications;
      if (typeof C.registerPlugin === 'function') return C.registerPlugin('PushNotifications');
    } catch (e) { /* fall through */ }
    return null;
  }

  function sameOriginPath(u) {
    try {
      if (!u) return null;
      var x = new URL(u, W.location.origin);
      return x.origin === W.location.origin ? x.pathname + x.search + x.hash : null;
    } catch (e) { return null; }
  }

  function wire(P) {
    if (wired) return;
    wired = true;
    P.addListener('registration', function (t) {
      try { if (sendTokenFn && t && t.value) sendTokenFn(t.value); } catch (e) { console.warn('[NativePush] sendToken failed', e); }
    });
    P.addListener('registrationError', function (err) { console.error('[NativePush] registration error:', err); });
    // App is open: Android does not draw a tray notification, so let the page refresh its notice badge.
    P.addListener('pushNotificationReceived', function (n) {
      try { W.dispatchEvent(new CustomEvent('sbz:push', { detail: n })); } catch (e) { /* ignore */ }
    });
    // User tapped a notification from the tray.
    P.addListener('pushNotificationActionPerformed', function (a) {
      try {
        var d = (a && a.notification && a.notification.data) || {};
        var path = sameOriginPath(d.url);
        if (path && path !== '/' && path !== W.location.pathname + W.location.search + W.location.hash) W.location.href = path;
      } catch (e) { /* ignore */ }
    });
  }

  async function registerNow(P) {
    wire(P);
    // Android 8+ needs a channel for heads-up/sound. Server sends channelId 'default'.
    try { await P.createChannel({ id: 'default', name: 'StudyBuddy Notices', description: 'Notices and updates', importance: 4, visibility: 1, vibration: true }); } catch (e) { /* older plugin / already exists */ }
    await P.register();
  }

  // The OS dialog can also be opened by MainActivity at launch. If our request lost that race (or the user is still
  // deciding), keep checking for a while and register the token as soon as permission turns granted.
  var waiting = false;
  function waitForGrant(P) {
    if (waiting) return;
    waiting = true;
    var tries = 0;
    var t = setInterval(async function () {
      tries++;
      try {
        var st = await P.checkPermissions();
        if (st && st.receive === 'granted') { clearInterval(t); waiting = false; await registerNow(P); }
        else if (tries >= 45) { clearInterval(t); waiting = false; }
      } catch (e) { clearInterval(t); waiting = false; }
    }, 2000);
  }

  // opts.force = user explicitly tapped "Enable" -> allowed to prompt again within the session.
  // Returns 'granted' | 'denied' | 'unsupported'.
  async function run(sendToken, opts) {
    opts = opts || {};
    if (typeof sendToken === 'function') sendTokenFn = sendToken;
    var P = plugin();
    if (!P) { console.warn('[NativePush] PushNotifications plugin not available in this app build'); return 'unsupported'; }
    var st = await P.checkPermissions();
    var state = st && st.receive;
    if (state === 'prompt' || state === 'prompt-with-rationale') {
      if (promptedThisSession && !opts.force) return 'denied';
      promptedThisSession = true;
      st = await P.requestPermissions();
      state = st && st.receive;
    }
    if (state !== 'granted') { console.warn('[NativePush] permission:', state); waitForGrant(P); return 'denied'; }
    await registerNow(P);
    return 'granted';
  }

  function bootstrap(sendToken, opts) {
    if (!isNative()) return Promise.resolve('unsupported');
    if (inflight) return inflight;
    inflight = run(sendToken, opts).catch(function (e) { console.error('[NativePush] failed:', e); return 'unsupported'; })
      .then(function (r) { inflight = null; return r; });
    return inflight;
  }

  W.SBZNativePush = { isNative: isNative, bootstrap: bootstrap };
})();
