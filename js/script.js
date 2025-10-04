/* =========================================================
   ACTIVE NAV ITEM
   Highlights the current page link and applies aria-current.
   ========================================================= */
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach((a) => {
    const match = a.getAttribute('href') === path;
    a.classList.toggle('active', match);
    if (match) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
})();

/* =========================================================
   ROTISSERIE VISUAL EFFECTS
   Adds heat shimmer (SVG filter) + flame particles (Canvas).
   Runs only when .rotisserie-visual exists on the page.
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const rotisserie = document.querySelector('.rotisserie-visual');
  const img = document.querySelector('.rotisserie-img');
  const canvas = document.querySelector('.flame-layer');
  const heatNoise = document.getElementById('heatNoise');

  if (!rotisserie || !img || !canvas) return; // Not on this page

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Heat shimmer (SVG turbulence animation) ---- */
  if (!prefersReduced && heatNoise) {
    let t = 0;
    (function animateHeat() {
      const fx = 0.010 + Math.sin(t) * 0.003;
      const fy = 0.020 + Math.cos(t * 0.8) * 0.003;
      heatNoise.setAttribute('baseFrequency', `${fx.toFixed(4)} ${fy.toFixed(4)}`);
      t += 0.015;
      requestAnimationFrame(animateHeat);
    })();
  } else if (prefersReduced) {
    img.style.filter = 'none'; // Disable shimmer for accessibility
  }

  /* ---- Flame particles on Canvas ---- */
  const ctx = canvas.getContext && canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const parent = canvas.parentElement;
  let w = 0, h = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
  let resizeRaf = null;

  function doResize() {
    const rect = parent.getBoundingClientRect();
    w = Math.floor(Math.min(rect.width, 420));
    h = Math.floor(w * 0.38); // 38% of width (matches CSS ratio)
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      doResize();
    });
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  const MAX = 140;
  const particles = [];

  function spawnParticle() {
    const x = w * 0.5 + (Math.random() - 0.5) * (w * 0.6);
    const y = h - 2;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(1.2 + Math.random() * 1.8),
      life: 0,
      maxLife: 40 + Math.random() * 40,
      size: 6 + Math.random() * 10,
    });
  }

  function flameColor(r) {
    if (r < 0.5) {
      const t = r / 0.5;
      const rC = 255;
      const gC = Math.floor(235 - 105 * t);
      const aC = 0.75 - t * 0.25;
      return `rgba(${rC},${gC},0,${aC})`;
    } else {
      const t = (r - 0.5) / 0.5;
      const rC = Math.floor(255 - 55 * t);
      const gC = Math.floor(130 - 90 * t);
      const bC = Math.floor(0 + 40 * t);
      const aC = 0.5 - t * 0.4;
      return `rgba(${rC},${gC},${bC},${aC})`;
    }
  }

  if (prefersReduced) return; // skip flames if motion disabled

  let last = performance.now();
  (function tick(now) {
    const dt = Math.min(32, now - last);
    last = now;

    if (particles.length < MAX) {
      for (let i = 0; i < 4; i++) spawnParticle();
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt * 0.06;
      const r = p.life / p.maxLife;

      p.x += p.vx + Math.sin((p.life + i) * 0.05) * 0.2;
      p.y += p.vy - r * 0.3;

      const size = p.size * (1 - r);
      ctx.beginPath();
      ctx.fillStyle = flameColor(r);
      ctx.ellipse(p.x, p.y, size * 0.6, size, 0, 0, Math.PI * 2);
      ctx.fill();

      if (p.life >= p.maxLife || p.y + 10 < 0) particles.splice(i, 1);
    }

    requestAnimationFrame(tick);
  })(last);
});

/* =========================================================
   CONTACT FORM (Mailto)
   Lightweight enhancement: prevents empty fields and confirms.
   ========================================================= */
document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.matches('form[action^="mailto:"]')) {
    e.preventDefault();

    const name = form.querySelector('#name')?.value.trim();
    const email = form.querySelector('#email')?.value.trim();
    const subject = form.querySelector('#subject')?.value.trim() || 'Enquiry';
    const message = form.querySelector('#message')?.value.trim();

    if (!name || !email || !message) {
      alert('Please fill in all fields before sending.');
      return;
    }

    // Compose mailto body safely
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    const mailto = `${form.action}?subject=${encodeURIComponent(subject)}&body=${body}`;

    // Open default mail client
    window.location.href = mailto;

    // User feedback
    alert('Your email client will open with your message. Thank you!');
    form.reset();
  }
});
