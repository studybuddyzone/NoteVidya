/*
  Gold gate — page-level lock for Gold-only pages (direct-link protection).

  Include on any page that should open ONLY for Gold / Diamond / staff roles, AFTER
  /js/sbz-legacy.js:   <script src="gold-gate.js"></script>

  - Fail-closed: the page is covered immediately; the cover is removed only after the
    logged-in user's role is confirmed as allowed.
  - Not logged in / Silver / Free / unknown → "Gold Membership Required" screen.
  - Real data protection still lives in the database (resources.min_tier); this stops
    people from opening the page itself through a direct link.
*/
(function () {
  var ALLOWED = ['gold', 'diamond', 'master', 'superadmin', 'super admin', 'super-admin', 'admin', 'moderator'];
  var ID = 'goldGateOverlay';

  function cover(html) {
    var el = document.getElementById(ID);
    if (!el) {
      el = document.createElement('div');
      el.id = ID;
      el.setAttribute('style', 'position:fixed;inset:0;z-index:2147483000;background:#0f1220;color:#eef0f6;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:"Plus Jakarta Sans",-apple-system,Segoe UI,sans-serif;');
      document.documentElement.appendChild(el);
    }
    el.innerHTML = html;
  }
  function uncover() {
    var el = document.getElementById(ID);
    if (el) el.remove();
  }
  var btn = 'display:inline-block;margin:6px;padding:12px 22px;border-radius:999px;font-weight:700;font-size:14px;text-decoration:none;';
  function lockedScreen(title, msg, showUpgrade) {
    cover(
      '<div style="max-width:360px;">' +
        '<div style="font-size:54px;margin-bottom:10px;">👑</div>' +
        '<div style="font-size:20px;font-weight:800;margin-bottom:8px;">' + title + '</div>' +
        '<div style="font-size:14px;line-height:1.6;color:#aab0c6;margin-bottom:18px;">' + msg + '</div>' +
        (showUpgrade ? '<a href="premium-get" style="' + btn + 'background:linear-gradient(135deg,#d4a017,#f0b429);color:#1b1500;">Get Gold Membership</a>' : '') +
        '<a href="javascript:void(0)" onclick="if(history.length>1){history.back();}else{location.href=\'/\';}" style="' + btn + 'background:rgba(255,255,255,0.08);color:#eef0f6;">← Go Back</a>' +
      '</div>'
    );
  }

  cover('<div style="font-size:14px;color:#aab0c6;">Checking access…</div>');

  var decided = false;
  function decide(role, user) {
    if (decided) return;
    decided = true;
    if (!user) {
      lockedScreen('Login Required', 'यह content देखने के लिए पहले login करें।', false);
      return;
    }
    if (ALLOWED.indexOf(String(role || '').toLowerCase().trim()) !== -1) uncover();
    else lockedScreen('Gold Membership Required', 'यह section सिर्फ़ <strong>Gold</strong> (और Diamond) members के लिए है। Demo देखने के लिए पिछले page पर "Demo" बटन इस्तेमाल करें।', true);
  }

  function start() {
    if (!window.SBZLegacy) { setTimeout(start, 100); return; }
    var auth = window.SBZLegacy.auth(), db = window.SBZLegacy.database();
    auth.onAuthStateChanged(function (user) {
      if (!user) { decide(null, null); return; }
      db.ref('users').orderByChild('uid').equalTo(user.uid).once('value').then(function (snap) {
        var role = '';
        if (snap && snap.exists()) snap.forEach(function (c) { var v = c.val(); role = (v && v.role) || ''; });
        decided = false; // allow re-evaluation if the role changes later in this session
        decide(role, user);
      }).catch(function () {
        decided = false;
        lockedScreen('Could not verify', 'Access verify नहीं हो पाया। Internet check करके page reload करें।', false);
        decided = true;
      });
    });
  }
  start();
  // Fail closed if nothing resolves in 12s.
  setTimeout(function () { if (!decided) lockedScreen('Could not verify', 'Access verify नहीं हो पाया। Internet check करके page reload करें।', false); }, 12000);
})();
