
(function () {
  'use strict';
  const KEY = 'gtmc_submit_popup_seen';
  const pop = document.getElementById('spPop');
  let seen = false, opener = null;
  try { seen = !!localStorage.getItem(KEY); } catch (e) { try { seen = !!sessionStorage.getItem(KEY); } catch (e2) {} }
  // not for visitors coming back from the payment gateway (they get the result card instead)
  if (seen || new URLSearchParams(location.search).get('status')) return;
  const remember = () => { try { localStorage.setItem(KEY, '1'); } catch (e) { try { sessionStorage.setItem(KEY, '1'); } catch (e2) {} } };
  function close() {
    pop.classList.remove('on'); pop.setAttribute('aria-hidden', 'true'); remember();
    document.removeEventListener('keydown', onKey);
    if (opener && opener.focus) opener.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = pop.querySelectorAll('a[href],button'); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function open() {
    if (new URLSearchParams(location.search).get('status') || document.getElementById('resultCard') && document.getElementById('resultCard').style.display === 'block') return;
    opener = document.activeElement;
    pop.classList.add('on'); pop.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', onKey);
    document.getElementById('spGo').focus();
  }
  document.getElementById('spX').addEventListener('click', close);
  document.getElementById('spLater').addEventListener('click', close);
  document.getElementById('spGo').addEventListener('click', remember);
  pop.addEventListener('click', (e) => { if (e.target === pop) close(); });
  setTimeout(open, 900);
})();
