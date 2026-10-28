// Devtools-guard v4
// Layers:
// 1) Keyboard shortcuts: F12, Ctrl/Cmd+Shift+I/J/C/K/E/M, Cmd+Alt+I/J/C/U (Mac), Ctrl/Cmd+U/S/P  -> block + redirect to /due
// 2) Screenshot / screen-capture shortcuts: PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5 -> page turns black, clipboard wiped.
//    Window blur / tab hidden (snipping-tool overlay, alt-tab, app switch) -> page turns black until the user comes back.
//    Print / "Save as PDF" -> page prints blank.
// 3) Right-click, copy, cut, drag, text-select block (inputs/textarea still work).
// 4) DevTools-open detection (DESKTOP only, 3 consecutive hits needed): window-size gap + `debugger` timing.
// 5) Native app hardware back-button (Capacitor).
// IMPORTANT: this is a DETERRENT. A browser page can never stop the OS itself (Win+Shift+S, Cmd+Shift+3/4/5, a phone's
// power+volume screenshot, a second camera). For real screenshot blocking inside the Android app use FLAG_SECURE.
(function () {
  if (window.__sbzGuardLoaded) return;
  window.__sbzGuardLoaded = true;

  var redirected = false;
  function go() {
    if (redirected) return;
    if (/^\/due(\.html)?\/?$/.test(location.pathname)) return;   // never loop on the target page
    redirected = true;
    try { window.location.replace("/due"); } catch (e) { window.location.href = "/due"; }
  }
  function block(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    go();
  }

  var isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) ||
                 (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

  // ---- Layer 5: native back-button handling ----
  function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  function attachBackButtonHandler() {
    if (!isNativeApp() || !window.Capacitor.Plugins || !window.Capacitor.Plugins.App) return;
    var CapApp = window.Capacitor.Plugins.App;
    CapApp.addListener("backButton", function (data) {
      if (data && data.canGoBack) window.history.back(); else CapApp.exitApp();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attachBackButtonHandler);
  else attachBackButtonHandler();

  // ---- Layer 2: black shield used for screenshots / blur / hidden tab ----
  var shield = null, shieldTimer = null, timedHide = false;
  function ensureShield() {
    if (shield || !document.body) return shield;
    shield = document.createElement("div");
    shield.setAttribute("aria-hidden", "true");
    shield.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:#000;display:none;";
    document.body.appendChild(shield);
    return shield;
  }
  function hidePage(ms) {
    var s = ensureShield(); if (!s) return;
    s.style.display = "block";
    clearTimeout(shieldTimer);
    timedHide = !!ms;
    if (ms) shieldTimer = setTimeout(function () { timedHide = false; showPage(true); }, ms);
  }
  function showPage(force) {
    if (!shield) return;
    if (timedHide && !force) return;                 // a screenshot key hide must run its full time
    shield.style.display = "none";
  }
  function wipeClipboard() {
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(" ").catch(function () {}); } catch (e) {}
  }
  function isScreenshotCombo(e, key) {
    if (key === "PRINTSCREEN" || e.keyCode === 44 || e.key === "Snapshot") return true;
    if (e.metaKey && e.shiftKey && key === "S") return true;                                  // Win+Shift+S
    if (e.metaKey && e.shiftKey && (key === "3" || key === "4" || key === "5" || key === "6")) return true;   // macOS
    return false;
  }
  function onScreenshotKey(e) {
    if (e) { try { e.preventDefault(); e.stopPropagation(); } catch (x) {} }
    hidePage(2500);
    wipeClipboard();
  }

  // ---- Layer 1 + 2: keyboard ----
  document.addEventListener("keydown", function (e) {
    var key = (e.key || "").toUpperCase();
    if (isScreenshotCombo(e, key)) return onScreenshotKey(e);
    if (e.keyCode === 123 || key === "F12") return block(e);
    var cm = e.ctrlKey || e.metaKey;
    if (cm && e.shiftKey && ["I", "J", "C", "K", "E", "M"].indexOf(key) !== -1) return block(e);
    if (e.metaKey && e.altKey && ["I", "J", "C", "U"].indexOf(key) !== -1) return block(e);      // Mac: Cmd+Option+I/J/C/U
    if (e.ctrlKey && e.altKey && ["I", "J", "C", "U"].indexOf(key) !== -1) return block(e);
    if (cm && ["U", "S", "P"].indexOf(key) !== -1) return block(e);
    showPage(false);                                  // a normal key after coming back clears a blur-hide
  }, true);
  document.addEventListener("keyup", function (e) {
    var key = (e.key || "").toUpperCase();
    if (key === "PRINTSCREEN" || e.keyCode === 44 || e.key === "Snapshot") onScreenshotKey(e);   // PrintScreen often fires only keyup
  }, true);

  // window loses focus (snipping overlay, alt-tab) or tab hidden / app switched -> black until back
  window.addEventListener("blur", function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (a && a.tagName === "IFRAME") return;        // clicking a YouTube / payment iframe also blurs the window: don't black out
      hidePage(0);
    }, 0);
  });
  window.addEventListener("focus", function () { showPage(false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) hidePage(0); else showPage(false); });
  window.addEventListener("pointerdown", function () { showPage(false); }, true);
  window.addEventListener("beforeprint", function () { hidePage(0); });
  window.addEventListener("afterprint", function () { showPage(true); });

  // ---- Layer 3: right-click, copy/cut, drag, select ----
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("copy", function (e) { e.preventDefault(); });
  document.addEventListener("cut", function (e) { e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { e.preventDefault(); });

  document.addEventListener("DOMContentLoaded", function () {
    var style = document.createElement("style");
    style.textContent =
      "body{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;}" +
      "input,textarea,[contenteditable='true']{-webkit-user-select:text;-moz-user-select:text;user-select:text;}" +
      "@media print{html,body{display:none!important;}}";
    document.head.appendChild(style);
    ensureShield();
  });

  // ---- Layer 4: devtools-open detection — DESKTOP only, debounced ----
  if (!isMobile) {
    var gapThreshold = 250, debuggerThreshold = 200, HITS_NEEDED = 3, hits = 0;
    setInterval(function () {
      var widthGap = window.outerWidth - window.innerWidth;
      var heightGap = window.outerHeight - window.innerHeight;
      var start = performance.now();
      debugger;
      var slow = (performance.now() - start) > debuggerThreshold;
      var suspicious = widthGap > gapThreshold || heightGap > gapThreshold || slow;
      hits = suspicious ? hits + 1 : 0;
      if (hits >= HITS_NEEDED) block();
    }, 1000);
  }
})();
