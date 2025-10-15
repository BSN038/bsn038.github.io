/* jshint esversion: 11 */
/* =========================================================
   ACTIVE NAV ITEM
   Highlights the current page link and applies aria-current.
   (Safe to run on every page.)
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
   ROTISSERIE VISUAL EFFECTS (Specific page)
   Adds heat shimmer (SVG filter) and flame particles (Canvas).
   Runs only when .rotisserie-visual and its elements exist.
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const rotisserie = document.querySelector('.rotisserie-visual');
  const img = document.querySelector('.rotisserie-img');
  const canvas = document.querySelector('.flame-layer');
  const heatNoise = document.getElementById('heatNoise');

  // Exit if this section is not on the current page
  if (!rotisserie || !img || !canvas) return;

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
    // Disable shimmer for accessibility
    img.style.filter = 'none';
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

  if (prefersReduced) return; // Skip flames if motion disabled

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
   CONTACT FORM (mailto: enhancement)
   Prevents empty fields and opens user's email client.
   Only runs for forms whose action starts with "mailto:".
   ========================================================= */
document.addEventListener('submit', (e) => {
  const form = e.target;
  if (!form.matches || !form.matches('form[action^="mailto:"]')) return;

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
  const body = encodeURIComponent(`Name: ${name}
Email: ${email}

Message:
${message}`);
  const mailto = `${form.action}?subject=${encodeURIComponent(subject)}&body=${body}`;

  // Open default mail client
  window.location.href = mailto;

  // User feedback
  alert('Your email client will open with your message. Thank you!');
  form.reset();
});

/* =========================================================
   BOOKING FORM (e.g., Formspree)
   Validates name, posts with fetch, and shows inline status.
   Runs only when #booking-form exists on the page.
   ========================================================= */
(function () {
  const form = document.getElementById('booking-form');
  if (!form) return;

  const nameEl   = document.getElementById('bk-name');
  const nameErr  = document.getElementById('bk-name-error');
  const statusEl = document.getElementById('booking-status');

  // Validate name: allow letters (incl. accents), spaces, apostrophes; no digits.
  function validateName() {
    const v = (nameEl?.value || '').trim();
    const re = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{1,48}$/;

    if (!nameEl || !nameErr) return true; // if elements are missing, skip validation

    if (!v) {
      nameEl.setCustomValidity('Please enter your name.');
      nameErr.textContent = 'Please enter your name.';
      return false;
    }
    if (!re.test(v)) {
      nameEl.setCustomValidity('Name should not contain numbers or symbols.');
      nameErr.textContent = 'Name should not contain numbers or symbols.';
      return false;
    }
    nameEl.setCustomValidity('');
    nameErr.textContent = '';
    return true;
  }

  if (nameEl) {
    nameEl.addEventListener('input', validateName);
    nameEl.addEventListener('blur', validateName);
  }

  // Helper to show state
  function showStatus(type, msg) {
    if (!statusEl) return;
    statusEl.className = 'status ' + type; // success | error
    statusEl.textContent = msg;
    statusEl.classList.remove('is-hidden');
  }

  // Submit handler
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Validation + native validity checks
    if (!validateName() || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    showStatus('success', 'Sending your booking…');
    const data = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });

      if (res.ok) {
        showStatus('success', 'Your request was sent. We’ll get back to you shortly!');
        form.reset();
      } else {
        const j = await res.json().catch(() => ({}));
        const msg = (j && j.errors && j.errors[0] && j.errors[0].message) || 'There was a problem sending your request.';
        showStatus('error', msg);
      }
    } catch (err) {
      showStatus('error', 'Network error. Please try again.');
    }
  });
})();

/* =========================================================
   RADIO "SPARK" EFFECT (Specific page)
   Always triggers a burst animation on selection or click.
   Runs only when .radio-spark exists.
   ========================================================= */
(function () {
  const root = document.querySelector('.radio-spark');
  if (!root) return;

  function burst(label) {
    const dot = label.querySelector('.sparkle');
    if (!dot) return;
    dot.classList.remove('burst');
    void dot.offsetWidth; // reflow to restart the animation
    dot.classList.add('burst');
  }

  // Fire when selection changes
  root.addEventListener('change', (e) => {
    const input = e.target.closest && e.target.closest('input[type="radio"]');
    if (!input) return;
    const label = input.closest('label.spark-item');
    if (label) burst(label);
  });

  // Also fire on clicks (so it bursts even if the same option is clicked again)
  root.addEventListener('click', (e) => {
    const label = e.target.closest && e.target.closest('label.spark-item');
    if (label) burst(label);
  });
})();

/* =========================================================
   HOME PAGE: Loader + background animation + typewriter slogan
   Runs only when #home-slogan exists (no effect elsewhere).
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('home-loader'); // brief brand moment
  const slogan = document.getElementById('home-slogan'); // slogan h2 (has colored HTML)
  const heroBg = document.getElementById('hero-watermark'); // watermark on the card wrapper

  // Do nothing if not on Home
  if (!slogan) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Typewriter: type plain text first, then restore colored HTML at the end
  const originalHTML = slogan.innerHTML;
  const tmp = document.createElement('div');
  tmp.innerHTML = originalHTML;
  const plainText = tmp.textContent || tmp.innerText || '';

  function typeSlogan() {
    const speed = 90; // ~90ms per char
    let i = 0;
    slogan.style.opacity = 1; // ensure visible when typing
    slogan.textContent = ''; // start empty (plain)

    (function tick() {
      slogan.textContent = plainText.slice(0, i++);
      if (i <= plainText.length) {
        setTimeout(tick, speed);
      } else {
        // After typing, restore the colored HTML version
        slogan.innerHTML = originalHTML;
      }
    })();
  }

  // Background subtle scroll (pattern)
  function startBgAnim() {
    if (!heroBg) return;
    let raf = null;
    let offset = 0;

    function step() {
      offset += 0.15; // subtle, cheap
      heroBg.style.backgroundPosition = `-${offset}px 0`;
      raf = requestAnimationFrame(step);
    }

    function onVis() {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf), (raf = null);
      } else if (!raf) {
        raf = requestAnimationFrame(step);
      }
    }

    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(step);
  }

  // Loader flow
  function showInstant() {
    if (loader) loader.hidden = true;
    slogan.innerHTML = originalHTML; // show final state immediately
    slogan.style.opacity = 1;
  }

  function runLoader() {
    if (loader) loader.hidden = false;
    setTimeout(() => {
      if (loader) loader.hidden = true;
      typeSlogan(); // type after loader ends
    }, 1200); // keep under 1.5s
  }

  // Start
  if (prefersReduced) {
    showInstant();
  } else {
    runLoader();
    startBgAnim();
  }
});
