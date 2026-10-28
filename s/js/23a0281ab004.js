
  // ── URL params ──
  const p       = new URLSearchParams(location.search);
  const prn     = p.get('prn')      || '—';
  const orderId = p.get('order_id') || '—';
  const role    = (p.get('role')    || 'silver').toLowerCase();

  const roleConfig = {
    silver:  { label: '🥈 SILVER',  cls: 'silver' },
    gold:    { label: '🥇 GOLD',    cls: 'gold'   },
    diamond: { label: '💎 DIAMOND', cls: 'diamond' }
  };
  const rc = roleConfig[role] || roleConfig.silver;

  document.getElementById('roleBadge').textContent = rc.label;
  document.getElementById('roleBadge').classList.add(rc.cls);
  document.getElementById('detRole').textContent   = rc.label;
  document.getElementById('detPRN').textContent    = prn;
  document.getElementById('detOrder').textContent  = orderId;

  // validity 6 months (180 days) from now
  const until = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  document.getElementById('detValidity').textContent =
    until.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

  // ── Particles (subtle floating dots) ──
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 55; i++) {
    dots.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.5 + 0.1
    });
  }

  (function animate() {
    ctx.clearRect(0, 0, W, H);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99,102,241,${d.a})`;
      ctx.fill();
    });
    requestAnimationFrame(animate);
  })();

  // ── Confetti burst ──
  const colors = ['#6366f1','#8b5cf6','#f59e0b','#34d399','#38bdf8','#f472b6'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: 0;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${Math.random() * 8 + 5}px;
      height: ${Math.random() * 8 + 5}px;
      animation-duration: ${Math.random() * 2 + 2}s;
      animation-delay: ${Math.random() * 0.8}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
