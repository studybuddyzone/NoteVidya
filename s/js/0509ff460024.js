
  // ── Auth gate: THIS is the fix for the "tapping Social Mode instantly
  // bounces to login" bug. The old code checked SBZLegacy.auth().currentUser
  // synchronously, which is still null for a brief moment while Supabase
  // restores the session from local storage — so a real, logged-in user
  // could get "Please sign in first" and get sent away. Here we wait for
  // the FIRST onAuthStateChanged callback (fires once auth truly knows
  // the answer) before deciding anything. ──
  (function () {
    let decided = false;
    SBZLegacy.auth().onAuthStateChanged(function (user) {
      if (decided) return; // only act on the first resolution
      decided = true;
      if (!user) {
        window.location.href = '/';
        return;
      }
      if (window.SocialMode && typeof window.SocialMode.open === 'function') {
        window.SocialMode.open();
      }
      if (window.AdminNotices && typeof window.AdminNotices.start === 'function') {
        window.AdminNotices.start();
      }
      const loader = document.getElementById('smBootLoader');
      const topBar = document.getElementById('smBootTopBar');
      if (loader) loader.classList.add('hide');
      if (topBar) topBar.style.display = 'none';
    });
    // Safety fallback: never let the boot loader spin forever if Supabase
    // itself fails to respond (e.g. network issue) — matches the same
    // 8s fallback pattern already used on the dashboard pages.
    setTimeout(function () {
      if (!decided) {
        decided = true;
        window.location.href = '/';
      }
    }, 12000);
  })();
