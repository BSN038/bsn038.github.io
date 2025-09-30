// Resalta el enlace del menú correspondiente a la página actual
(function(){
  const path = location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('nav a').forEach(a=>{
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();
// ---------------------------------------
// Rotisserie: heat shimmer + flame particles
// Runs only if the rotisserie elements exist
// ---------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const rotisserie = document.querySelector('.rotisserie-visual');
  const img = document.querySelector('.rotisserie-img');
  const canvas = document.querySelector('.flame-layer');
  const heatNoise = document.getElementById('heatNoise');

  // Stop if the section is not on this page
  if (!rotisserie || !img || !canvas) return;

  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Heat shimmer (SVG turbulence animation) ----
  let t = 0;
  function animateHeat() {
    if (!heatNoise) return; // filter not found
    // small, slow wobble for a natural heat effect
    const fx = 0.010 + Math.sin(t) * 0.003;
    const fy = 0.020 + Math.cos(t * 0.8) * 0.003;
    heatNoise.setAttribute('baseFrequency', fx.toFixed(4) + ' ' + fy.toFixed(4));
    t += 0.015;
    requestAnimationFrame(animateHeat);
  }
  if (!prefersReduced) requestAnimationFrame(animateHeat);

  // ---- Flames (simple particle system on canvas) ----
  const ctx = canvas.getContext('2d', { alpha: true });
  const parent = canvas.parentElement;

  let w = 0, h = 0, dpr = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    // Size canvas to the visual width and the CSS % height
    const rect = parent.getBoundingClientRect();
    w = Math.floor(Math.min(rect.width, 420)); // match CSS max-width
    h = Math.floor(w * 0.38);                  // 38% of width (same visual ratio)
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Recalculate on load and on resize
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Particle settings
  const MAX = 140;
  const particles = [];

  function spawnParticle() {
    const x = (w * 0.5) + (Math.random() - 0.5) * (w * 0.6);
    const y = h - 2;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(1.2 + Math.random() * 1.8),
      life: 0,
      maxLife: 40 + Math.random() * 40,
      size: 6 + Math.random() * 10
    });
  }

  function flameColor(r) {
    // r = 0..1 life ratio -> yellow -> orange -> red
    if (r < 0.5) {
      const t = r / 0.5;
      const rC = 255;
      const gC = Math.floor(235 - 105 * t);
      const bC = 0;
      const aC = 0.75 - t * 0.25;
      return `rgba(${rC},${gC},${bC},${aC})`;
    } else {
      const t = (r - 0.5) / 0.5;
      const rC = Math.floor(255 - 55 * t);
      const gC = Math.floor(130 - 90 * t);
      const bC = Math.floor(0 + 40 * t);
      const aC = 0.5 - t * 0.4;
      return `rgba(${rC},${gC},${bC},${aC})`;
    }
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(32, now - last);
    last = now;

    if (prefersReduced) return; // respect user setting

    // Maintain particle count
    if (particles.length < MAX) {
      for (let i = 0; i < 4; i++) spawnParticle();
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter'; // additive glow

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt * 0.06;
      const r = p.life / p.maxLife;

      // Motion: rise + small horizontal sway
      p.x += p.vx + Math.sin((p.life + i) * 0.05) * 0.2;
      p.y += p.vy - r * 0.3;

      // Draw flame ellipse
      ctx.beginPath();
      ctx.fillStyle = flameColor(r);
      const size = p.size * (1 - r);
      ctx.ellipse(p.x, p.y, size * 0.6, size, 0, 0, Math.PI * 2);
      ctx.fill();

      // Remove dead particles
      if (p.life >= p.maxLife || p.y + 10 < 0) particles.splice(i, 1);
    }

    requestAnimationFrame(tick);
  }

  if (!prefersReduced) requestAnimationFrame(tick);
});
