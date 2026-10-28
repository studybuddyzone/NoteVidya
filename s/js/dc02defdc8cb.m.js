
    const db = SBZLegacy.database();
  const ref = (d, path) => d.ref(path);
  const get = (r) => r.once('value');

  // Allowed admin roles
  const ADMIN_ROLES = ['master', 'super admin', 'superadmin', 'admin'];

  // State
  let currentUserRole = null;

  // ── Expose verify function globally ──
  window.verifyPRN = async function() {
    const prn = document.getElementById('prnInput').value.trim();
    if (!prn) {
      showResult('loading', '⚠️', 'Please enter your PRN number', '');
      return;
    }

    const btn = document.getElementById('verifyBtn');
    btn.disabled = true;
    btn.textContent = 'Verifying…';
    showResult('loading', null, 'Checking account…', 'Fetching role');

    try {
      const snapshot = await get(ref(db, `users/${prn}`));

      if (!snapshot.exists()) {
        showResult('restricted', '❌', 'PRN Not Found', 'No record exists for this PRN number');
        updateHeaderBadge('NOT FOUND', '#ef4444');
      } else {
        const data = snapshot.val();
        const role = (data.role || 'student').toLowerCase().trim();
        currentUserRole = role;

        const isAdmin = ADMIN_ROLES.some(r => role === r || role.includes(r));

        if (isAdmin) {
          const displayRole = role.toUpperCase().replace('SUPERADMIN', 'SUPER ADMIN');
          showResult('granted', '✅', `Access Granted — ${displayRole}`, 'You have permission to access the Admin Panel');
          updateHeaderBadge(displayRole, '#22c55e');
          // Show color bar only for master
          if (role === 'master') {
            document.getElementById('themeBar').classList.add('show');
          }
        } else {
          const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
          showResult('restricted', '🚫', `Role: ${displayRole} — Restricted`, 'Admin Panel access is limited to Master, Super Admin & Admin roles only');
          updateHeaderBadge(displayRole, '#f59e0b');
        }
      }
    } catch(err) {
      showResult('restricted', '⚠️', 'Verification Error', err.message);
    }

    btn.disabled = false;
    btn.textContent = 'Verify Identity';
  };


  function showResult(type, icon, role, sub) {
    const el    = document.getElementById('verifyResult');
    const icEl  = document.getElementById('resultIcon');
    const roEl  = document.getElementById('resultRole');
    const suEl  = document.getElementById('resultSub');

    el.className = 'show';
    el.classList.add('show', type);

    if (type === 'loading' && !icon) {
      // spinner
      icEl.innerHTML = '<div class="spinner"></div>';
    } else {
      icEl.textContent = icon || '';
    }
    roEl.textContent = role;
    suEl.textContent = sub;
    el.style.display = 'flex';
  }


  function updateHeaderBadge(role, color) {
    const badge = document.getElementById('roleBadge');
    const dot   = document.getElementById('roleDot');
    const text  = document.getElementById('roleText');
    badge.classList.add('show');
    dot.style.background = color;
    dot.style.boxShadow = `0 0 6px ${color}`;
    text.textContent = role;
    text.style.color = color;
  }

  // Allow Enter key
  document.getElementById('prnInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') window.verifyPRN();
  });

  // ── THEME SLIDER ──
  function applyTheme(hue) {
    const root = document.documentElement;
    // Accent (indigo-ish at default 240)
    root.style.setProperty('--accent',   `hsl(${hue}, 80%, 62%)`);
    root.style.setProperty('--accent2',  `hsl(${hue}, 85%, 72%)`);
    // Diamond (offset +40)
    const dHue = (hue + 40) % 360;
    root.style.setProperty('--diamond',  `hsl(${dHue}, 80%, 60%)`);
    root.style.setProperty('--diamond2', `hsl(${dHue}, 85%, 72%)`);
    // Glow vars
    root.style.setProperty('--glow-accent',   `hsla(${hue}, 80%, 55%, 0.35)`);
    root.style.setProperty('--glow-diamond',  `hsla(${dHue}, 80%, 55%, 0.3)`);
    // Preview dot
    const dot = document.getElementById('themePreviewDot');
    if (dot) {
      dot.style.background = `hsl(${hue}, 80%, 62%)`;
      dot.style.boxShadow  = `0 0 10px hsl(${hue}, 80%, 62%)`;
    }
  }

  document.getElementById('hueSlider').addEventListener('input', function() {
    applyTheme(parseInt(this.value));
  });

  // Init dot color on load
  applyTheme(240);
