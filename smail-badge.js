// smail-badge.js — shows an unread-count badge on every S-Mail nav button (id/class "sm-nav-badge").
(function () {
  var MAP = { '1': 'first', '2': 'second', '3': 'third', '4': 'fourth' };
  function setBadge(n) {
    var els = document.querySelectorAll('.sm-nav-badge');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = n > 9 ? '9+' : String(n);
      els[i].style.display = n > 0 ? 'flex' : 'none';
    }
  }
  async function check() {
    try {
      if (!window.sbz) return;
      var s = await window.sbz.auth.getSession();
      var sess = s && s.data && s.data.session;
      if (!sess) return;
      var p = await window.sbz.from('profiles').select('year').eq('id', sess.user.id).maybeSingle();
      var year = (p.data && MAP[String(p.data.year)]) || '';
      var r = await fetch('/api/notices?year=' + encodeURIComponent(year), { headers: { Authorization: 'Bearer ' + sess.access_token } });
      if (!r.ok) return;
      var d = await r.json();
      setBadge(Number(d && d.unreadCount) || 0);
    } catch (e) { /* badge is optional */ }
  }
  function start() { setTimeout(check, 1500); setInterval(function () { if (!document.hidden) check(); }, 90000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
