
  const p       = new URLSearchParams(location.search);
  const prn     = p.get('prn')            || '—';
  const orderId = p.get('order_id')       || '—';
  const status  = (p.get('error') || p.get('payment_status') || 'failed').toUpperCase();

  document.getElementById('detPRN').textContent   = prn;
  document.getElementById('detOrder').textContent = orderId;

  const pill    = document.getElementById('statusPill');
  const reason  = document.getElementById('reasonText');
  const subText = document.getElementById('subText');

  if (status === 'CANCELLED' || status === 'USER_DROPPED' || status === 'PAYMENT_FAILED') {
    pill.textContent = '⚠️ CANCELLED';
    reason.textContent = 'Payment beech mein cancel ho gayi. Agar balance deduct hua hai to 5-7 dinon mein refund aayega.';
    subText.innerHTML = 'Payment cancel ho gayi.<br/>Fir se try karo, koi issue nahi!';
  } else if (status === 'PENDING') {
    pill.textContent = '⏳ PENDING';
    pill.classList.add('pending-pill');
    reason.textContent = 'Payment pending hai. Thodi der mein automatically update hoga. Agar 1 ghante baad bhi pending hai to support se contact karo.';
    subText.innerHTML = 'Payment pending state mein hai.<br/>1-2 ghante wait karo.';
  } else {
    pill.textContent = '❌ FAILED';
    reason.textContent = 'Bank ya payment gateway se transaction decline hui. Balance, limit ya network issue ho sakta hai. Fir se try karo.';
  }

  // Retry with PRN pre-filled
  const retryBtn = document.getElementById('retryBtn');
  if (prn !== '—') retryBtn.href = `/payment?prn=${prn}`;

  // ── Particles ──
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 40; i++) {
    dots.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.3 + 0.08
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
      ctx.fillStyle = `rgba(239,68,68,${d.a})`;
      ctx.fill();
    });
    requestAnimationFrame(animate);
  })();
