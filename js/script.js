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
      // FIX: use a template string with backticks
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
    // FIX: use template strings
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
    // FIX: return proper CSS color strings
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

  // FIX: build a safe body with newlines and encode it
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  );
  const mailto = `${form.action}?subject=${encodeURIComponent(subject)}&body=${body}`;

  window.location.href = mailto; // Open default mail client
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
  const loader = document.getElementById('home-loader');   // brief brand moment
  const slogan = document.getElementById('home-slogan');   // slogan h2 (has colored HTML)
  const heroBg = document.getElementById('hero-watermark'); // watermark on the card wrapper

  // Do nothing if not on Home
  if (!slogan) return;

  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Typewriter: type plain text first, then restore colored HTML at the end
  const originalHTML = slogan.innerHTML;
  const tmp = document.createElement('div');
  tmp.innerHTML = originalHTML;
  const plainText = tmp.textContent || tmp.innerText || '';

  function typeSlogan() {
    const speed = 90; // ~90ms per char
    let i = 0;
    slogan.style.opacity = 1; // ensure visible when typing
    slogan.textContent = '';  // start empty (plain)

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
      // FIX: use a proper template string
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
  // startBgAnim(); // CSS handles the drift
}

});

/* Checkout demo: stepper logic (runs only if #checkout-demo exists) */
(function () {
  const host = document.getElementById('checkout-demo');
  if (!host) return;

  const form = host.querySelector('#checkout-form');
  const statusEl = host.querySelector('#ck-status');
  const fieldsets = Array.from(host.querySelectorAll('#checkout-form fieldset'));
  const stepItems = Array.from(host.querySelectorAll('.steps li'));

  // Botones: Back, Next, Pay Now (dentro de .wizard-actions)
  const actions = host.querySelector('.wizard-actions');
  const btnBack = actions?.querySelector('.btn.btn-secondary');
  const btnNext = actions?.querySelector('button.btn:not(.btn-secondary):not(.btn--hot)');
  const btnPay  = actions?.querySelector('button.btn--hot[type="submit"]');

  // Map de clases spice por paso
  const spiceMap = ['spice-bg--mild', 'spice-bg--mild', 'spice-bg--medium', 'spice-bg--hot'];

  let current = 0;

  // Helpers
  const showStatus = (type, msg) => {
    if (!statusEl) return;
    statusEl.className = 'status' + (type ? ' ' + type : '');
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('is-hidden', !msg);
  };

  const setSpice = (i) => {
    host.classList.remove('spice-bg--mild', 'spice-bg--medium', 'spice-bg--hot');
    host.classList.add(spiceMap[i] || 'spice-bg--mild');
  };

  const setStep = (i) => {
    current = Math.max(0, Math.min(i, fieldsets.length - 1));
    fieldsets.forEach((fs, idx) => fs.classList.toggle('is-hidden', idx !== current));
    stepItems.forEach((el, idx) => {
      if (idx === current) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    btnBack.disabled = current === 0;
    btnNext.hidden   = current === fieldsets.length - 1;
    btnPay.hidden    = current !== fieldsets.length - 1;
    setSpice(current);
    // Expose current step for CSS
host.setAttribute('data-step', String(current));

    showStatus('', '');
    // Enfocar el legend para accesibilidad
    fieldsets[current].querySelector('legend')?.focus?.();
  };

  // Validación  fieldset visible
  const validateCurrent = () => {
    const fs = fieldsets[current];
    if (!fs) return true;
    let ok = true;

    const controls = Array.from(fs.querySelectorAll('input, select, textarea'));
    controls.forEach((inp) => {
      // limpia error previo
      const errId = (inp.getAttribute('aria-describedby') || '').split(' ').find((id) => /-err$/.test(id));
      const errEl = errId ? host.querySelector('#' + errId) : null;
      if (errEl) errEl.hidden = true;

      // validación HTML5 básica
      const valid = inp.checkValidity();
      if (!valid) {
        ok = false;
        if (errEl) errEl.hidden = false;
      }
    });

    return ok;
  };

  // Events navigation
  btnBack?.addEventListener('click', () => {
    setStep(current - 1);
  });

  btnNext?.addEventListener('click', () => {
    if (!validateCurrent()) {
      showStatus('error', 'Please fix the highlighted fields in this step.');
      return;
    }
    setStep(current + 1);
  });

  // Submit/Payment prototype
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateCurrent()) {
      showStatus('error', 'Please fix the highlighted fields in this step.');
      return;
    }
    // loading state
    btnPay.classList.add('is-loading'); btnPay.disabled = true;
    showStatus('loading', 'Processing payment…');

    // Simulation
    setTimeout(() => {
      btnPay.classList.remove('is-loading'); btnPay.disabled = false;
      const orderNo = 'BKCD-' + Math.floor(Math.random() * 90000 + 10000);
      showStatus('success', '✅ Payment approved. Your order number is ' + orderNo + '.');
      // Opcional: form.reset(); setStep(0);
    }, 1200);
  });

  // Init
  setStep(0);
})();

/* =========================================================
   BKC AI Assistant (with welcome message + env auto-detect)
   - Open/close logic
   - ESC to close
   - Welcome tips (example questions)
   - Fetches Netlify (local) or Vercel (prod) automatically
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  // Elements
  var win = document.getElementById('bkc-ai');
  var btn = document.getElementById('bkc-ai-toggle');
  var btnClose = document.getElementById('bkc-ai-close');
  var form = document.getElementById('bkc-ai-form');
  var input = document.getElementById('bkc-ai-user');
  var body = document.getElementById('bkc-ai-body');

  if (!win || !btn) return;

  // Open/Close
  function openChat() {
    win.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    if (input) setTimeout(function () { input.focus(); }, 0);
  }
  function closeChat() {
    win.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }
  btn.addEventListener('click', openChat);
  if (btnClose) btnClose.addEventListener('click', closeChat);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !win.hidden) closeChat();
  });

  // Welcome message (render once)
  if (body && !body.dataset.welcome) {
    var welcome = document.createElement('div');
    welcome.style.margin = '0 0 .9rem';
    welcome.style.padding = '.5rem .7rem';
    welcome.style.borderRadius = '10px';
    welcome.style.background = '#fafafa';
    welcome.style.border = '1px solid #eee';
    welcome.innerHTML = `
  <strong>Hi! I’m your BKC Assistant 👋</strong>
  <p>Ask me anything — or try:</p>
  <ul style="margin:.4rem 0 0 1rem; padding:0; list-style:disc;">
    <li>What is BKC?</li>
    <li>Where are you located?</li>
    <li>What are your opening hours?</li>
    <li>Who is the owner of this restaurant?</li>
    <li>Who is José Castro?</li>
    <li>What professional skills does José Castro have?</li>
  </ul>
`;
    body.appendChild(welcome);
    body.dataset.welcome = '1';
  }

  // Submit: send message to serverless endpoint
  if (form && input && body) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var text = (input.value || '').trim();
      if (!text) return;

      // 1) Append user bubble
      var p = document.createElement('p');
      p.textContent = text;
      p.style.margin = '0 0 .6rem';
      p.style.padding = '.5rem .7rem';
      p.style.border = '1px solid #e3e3e3';
      p.style.borderRadius = '10px';
      p.style.alignSelf = 'flex-end';
      p.style.background = '#f5f7ff';
      body.appendChild(p);
      body.scrollTop = body.scrollHeight;

      // 2) Typing indicator
      var typing = document.createElement('p');
      typing.textContent = 'Assistant is typing…';
      typing.style.margin = '0 0 .9rem';
      typing.style.padding = '.5rem .7rem';
      typing.style.borderRadius = '10px';
      typing.style.background = '#fafafa';
      typing.style.border = '1px solid #eee';
      typing.style.opacity = '.8';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      // 3) Pick endpoint: Netlify (local) vs Vercel (prod)
      var isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
      var endpoint = isLocal ? '/.netlify/functions/ask' : '/api/ask';

      // 4) Call the endpoint
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 12000);

      try {
        var res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
          signal: ctrl.signal
        });
        clearTimeout(timer);

        var reply = 'Sorry, I could not reach the assistant right now.';
        if (res && res.ok) {
          var data = await res.json();
          if (data && typeof data.reply === 'string' && data.reply.trim()) {
            reply = data.reply.trim();
          }
        }

        // 5) Replace typing with the assistant reply
        var a = document.createElement('p');
        a.textContent = reply;
        a.style.margin = '0 0 .9rem';
        a.style.padding = '.5rem .7rem';
        a.style.borderRadius = '10px';
        a.style.background = '#fafafa';
        a.style.border = '1px solid #eee';

        if (typing.parentNode) typing.parentNode.replaceChild(a, typing);
        else body.appendChild(a);

      } catch (err) {
        // Network/error case
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        var errP = document.createElement('p');
        errP.textContent = 'Network error. Please try again in a moment.';
        errP.style.margin = '0 0 .9rem';
        errP.style.padding = '.5rem .7rem';
        errP.style.borderRadius = '10px';
        errP.style.background = '#fff3f3';
        errP.style.border = '1px solid #ffd6d6';
        body.appendChild(errP);
      } finally {
        input.value = '';
        body.scrollTop = body.scrollHeight;
      }
    });
  }
});
/* =========================== end BKC AI Assistant ========================== */

function toggleTooltip(id) {
  const all = document.querySelectorAll('.tooltip');
  const current = document.getElementById(id);

  if (current.style.display === 'block') {
    // Ya está abierta → cerrarla
    current.style.display = 'none';
  } else {
    // Cerrar todas y abrir solo la actual
    all.forEach(t => t.style.display = 'none');
    current.style.display = 'block';
  }
}

/* =====================================================
   Floating Feedback Widget Logic
   ===================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const fbWindow = document.getElementById('bkc-feedback');
  const fbToggle = document.getElementById('feedback-toggle');
  const fbClose = document.getElementById('feedback-close');
  const fbForm = document.getElementById('feedback-form');

  if (!fbWindow || !fbToggle) return;

  // Open feedback window
  fbToggle.addEventListener('click', () => {
    fbWindow.hidden = false;
    fbToggle.setAttribute('aria-expanded', 'true');
  });

  // Close feedback window
  if (fbClose) {
    fbClose.addEventListener('click', () => {
      fbWindow.hidden = true;
      fbToggle.setAttribute('aria-expanded', 'false');
    });
  }

  // Close when pressing ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !fbWindow.hidden) {
      fbWindow.hidden = true;
      fbToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle form submit
  if (fbForm) {
    fbForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(fbForm);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      try {
        const res = await fetch(fbForm.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json
        });

        if (res.ok) {
          fbForm.innerHTML = `
            <p style="text-align:center;color:#0D47A1;font-weight:bold;">
              ✅ Thank you for your feedback!
            </p>
          `;
          setTimeout(() => { fbWindow.hidden = true; }, 2000);
        } else {
          alert("There was an issue sending your feedback.");
        }
      } catch (err) {
        alert("Network error, please try again later.");
      }
    });
  }
});

/* ===========================
   BKC Flame Passport Logic
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  const stamps = document.querySelectorAll('.stamp');
  const input = document.getElementById('code-input');
  const btn = document.getElementById('redeem-btn');
  const status = document.getElementById('passport-status');

  // Load progress from localStorage
  const progress = JSON.parse(localStorage.getItem('bkc_stamps')) || [];
  progress.forEach(id => {
    const el = document.querySelector(`.stamp[data-id="${id}"]`);
    if (el) el.classList.add('active');
  });

  const validCodes = ['BKC1', 'BKC2', 'BKC3', 'BKC4', 'BKC5', 'BKC6', 'BKC7', 'BKC8', 'BKC9', 'BKC10', 'BKC11', 'BKC12'];

  btn.addEventListener('click', () => {
    const code = input.value.trim().toUpperCase();
    input.value = '';
    if (!code) return;

    if (!validCodes.includes(code)) {
      status.textContent = '❌ Invalid code.';
      return;
    }

    const used = progress.includes(code.replace('BKC', ''));
    if (used) {
      status.textContent = '⚠️ Code already used.';
      return;
    }

    const id = code.replace('BKC', '');
    const stamp = document.querySelector(`.stamp[data-id="${id}"]`);
    if (stamp) {
      stamp.classList.add('active');
      progress.push(id);
      localStorage.setItem('bkc_stamps', JSON.stringify(progress));
      status.textContent = '✅ Stamp unlocked!';
    }

    if (progress.length === 12) {
      status.textContent = '🎉 All 12 flames collected! Enjoy your Full Chicken!';
    }
  });
});

// ================================
// Ambient Sound Toggle (fire-loop)
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('bkc-sound');
  const toggle = document.getElementById('sound-toggle');
  if (!video || !toggle) return;

  let playing = false;

  // Hide video visually but keep sound available
  video.style.position = "absolute";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.opacity = "0";

  toggle.addEventListener('click', () => {
    if (!playing) {
      video.play();
      playing = true;
      toggle.textContent = '🔇';
    } else {
      video.pause();
      playing = false;
      toggle.textContent = '🔊';
    }
  });
});



