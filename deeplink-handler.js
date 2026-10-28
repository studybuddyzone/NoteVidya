/* deeplink-handler.js
 * StudyBuddy — Capacitor deep-link navigation.
 *
 * Once Android App Links are verified (see assetlinks.json + AndroidManifest
 * intent-filter), tapping a shared studybuddypro-psi.vercel.app link launches
 * this app instead of the browser. Capacitor hands the app the URL via:
 *   - App.getLaunchUrl()      → app was closed, this link cold-started it
 *   - App.addListener('appUrlOpen', ...) → app was already open/running
 * Neither of these navigates the WebView on its own — that's this file's job.
 * Include it near the top of <body> on every page (it's a no-op outside the
 * native app / when Capacitor's App plugin isn't present).
 */
(function () {
  function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  function sameOriginPath(urlStr) {
    try {
      const u = new URL(urlStr);
      if (u.origin !== window.location.origin) return null;
      return u.pathname + u.search + u.hash;
    } catch (e) { return null; }
  }
  function navigateIfDifferent(urlStr) {
    const path = sameOriginPath(urlStr);
    if (!path) return;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (path !== current) window.location.href = path;
  }

  if (!isNativeApp() || !window.Capacitor.Plugins || !window.Capacitor.Plugins.App) return;
  const AppPlugin = window.Capacitor.Plugins.App;

  // Already-running app receives a new link tap while the WebView is alive.
  AppPlugin.addListener('appUrlOpen', (data) => {
    if (data && data.url) navigateIfDifferent(data.url);
  });

  // App was cold-started BY this link — jump straight there instead of
  // sitting on whatever page server.url loaded by default.
  if (AppPlugin.getLaunchUrl) {
    AppPlugin.getLaunchUrl().then((result) => {
      if (result && result.url) navigateIfDifferent(result.url);
    }).catch(() => {});
  }
})();
