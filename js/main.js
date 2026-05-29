'use strict';

/* JS-loaded class — used by CSS to enable reveal animations only when JS runs */
document.documentElement.classList.add('js-loaded');

/* ════════════════════════════════════════
   SCROLL PROGRESS BAR
════════════════════════════════════════ */
const progressBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = `${Math.min(pct, 100)}%`;
}, { passive: true });

/* ════════════════════════════════════════
   NAV — SCROLL STATE
════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 60);
}, { passive: true });

/* ════════════════════════════════════════
   MOBILE NAV TOGGLE
════════════════════════════════════════ */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('nav__links--open');
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('nav__links--open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* ════════════════════════════════════════
   EMBER PARTICLE SYSTEM (canvas)
   On-brand fire embers for "Forno" (oven)
════════════════════════════════════════ */
(function initEmbers() {
  const canvas = document.getElementById('embers');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = [
    [201, 168, 76],   // brand gold
    [228, 201, 122],  // light gold
    [245, 166, 35],   // amber
    [255, 200, 80],   // warm gold
    [255, 245, 200],  // pale warm white
    [255, 130, 20],   // deep orange-gold
  ];
  const MAX = 42; // reduced density

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function spawn(randomY) {
    const cx = Math.random() * canvas.width;
    const cy = randomY
      ? Math.random() * canvas.height
      : canvas.height * (0.75 + Math.random() * 0.25);
    const maxLife = 140 + Math.random() * 200;
    return {
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 0.55,
      vy: -(0.4 + Math.random() * 1.1),
      size: 0.4 + Math.random() * 1.4, // smaller
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.03 + Math.random() * 0.04,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      maxLife,
      life: randomY ? Math.random() * maxLife : maxLife,
    };
  }

  const particles = Array.from({ length: MAX }, () => spawn(true));

  /* ── Ignition spark burst ── */
  const SPARK_COLORS = [
    [255, 255, 230],  // near-white hot
    [255, 230, 140],  // bright gold
    [255, 180, 60],   // orange-gold
    [255, 120, 20],   // deep orange
    [201, 168, 76],   // brand gold
  ];
  const sparks = [];
  let flashRing = null;

  function spawnSpark(ox, oy) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 5.5;
    const maxLife = 22 + Math.floor(Math.random() * 32);
    return {
      x: ox + (Math.random() - 0.5) * 18,
      y: oy + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8, // upward bias
      size: 0.9 + Math.random() * 2.6,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      maxLife,
      life: maxLife,
    };
  }

  // Fire the burst at 280ms — aligned with oven icon fade-in
  setTimeout(() => {
    const ox = canvas.width * 0.5;
    const oy = canvas.height * 0.28;
    for (let i = 0; i < 58; i++) sparks.push(spawnSpark(ox, oy));
    // Expanding flash ring
    flashRing = { x: ox, y: oy, r: 4, maxR: 72, life: 22, maxLife: 22 };
  }, 280);

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* flash ring */
    if (flashRing) {
      flashRing.life--;
      flashRing.r += (flashRing.maxR - 4) / flashRing.maxLife;
      const ft = flashRing.life / flashRing.maxLife;
      ctx.save();
      ctx.globalAlpha = ft * 0.55;
      ctx.strokeStyle = 'rgb(255,210,90)';
      ctx.lineWidth   = 2.5 * ft;
      ctx.shadowColor = 'rgb(255,170,30)';
      ctx.shadowBlur  = 18 * ft;
      ctx.beginPath();
      ctx.arc(flashRing.x, flashRing.y, flashRing.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (flashRing.life <= 0) flashRing = null;
    }

    /* sparks */
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x  += s.vx;
      s.y  += s.vy;
      s.vx *= 0.93;
      s.vy += 0.09; // gravity drag
      s.life--;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }

      const t = s.life / s.maxLife; // 1→0 as spark dies
      const [cr, cg, cb] = s.color;

      ctx.save();
      ctx.globalAlpha = t * 0.95;
      ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur  = s.size * 7;
      ctx.fillStyle   = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(s.size * t, 0.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ambient embers — much subtler */
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.phase += p.phaseSpeed;
      p.x  += p.vx + Math.sin(p.phase) * 0.38;
      p.y  += p.vy;
      p.vy -= 0.007;
      p.life--;

      if (p.life <= 0 || p.y < -12) {
        particles[i] = spawn(false);
        continue;
      }

      const t = p.life / p.maxLife;
      const alpha = t > 0.85 ? (1 - t) / 0.15
                  : t < 0.2  ? t / 0.2
                  : 1;
      const flicker = 0.72 + Math.sin(p.phase * 4.3) * 0.28;
      const r = p.size * flicker;
      const [cr, cg, cb] = p.color;

      ctx.save();
      ctx.globalAlpha = alpha * 0.36; // was 0.88 — much more subtle
      ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur  = r * 3;        // was r * 5
      ctx.fillStyle   = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(r, 0.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(tick);
  }
  tick();
})();

/* ════════════════════════════════════════
   SCROLL UNDRAW — illustration dissolves
   as the hero scrolls out of view and
   redraws when the user scrolls back up.
════════════════════════════════════════ */
(function initScrollUndraw() {
  const hero  = document.getElementById('inicio');
  const illus = hero?.querySelector('.hero__illustration');
  if (!hero || !illus) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Collect every drawn child element */
  const paths = [...illus.querySelectorAll([
    '.draw-mountains-far *',
    '.draw-mountains-mid *',
    '.draw-mountains-near *',
    '.draw-camino *:not(.camino-dashes)',
    '.draw-trees *',
    '.draw-ground-detail *',
    '.draw-cathedral-mountain *',
    '.draw-cathedral-base *',
    '.draw-towers-base *',
    '.draw-facade *',
    '.draw-towers-upper *',
    '.draw-spires *',
    '.draw-details *',
  ].join(','))];

  let ready   = false;
  let ticking = false;
  let prevT   = -1;

  /* Take over from the CSS draw animations */
  function enableScrollControl() {
    if (ready) return;
    ready = true;
    paths.forEach(el => {
      el.style.strokeDashoffset = '0';
      el.style.animation        = 'none';
    });
  }

  /* svg-ready fires at ~2.3s; last draw animation ends at ~2.3 + 7.7 + 0.8 = 10.8s */
  if (reduceMotion) {
    enableScrollControl();
  } else {
    setTimeout(enableScrollControl, 11200);
  }

  /* Scroll listener */
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  function update() {
    ticking = false;

    const heroH = hero.offsetHeight;
    const raw   = window.scrollY / heroH;

    /* Map scroll: starts dissolving at 5 %, fully gone at 85 % */
    const t = Math.min(Math.max((raw - 0.05) / 0.80, 0), 1);
    if (t === prevT) return;
    prevT = t;

    /* Force-enable if user scrolls before animations complete */
    if (!ready && t > 0) enableScrollControl();
    if (!ready) return;

    /* Ease-in-out curve for a smooth, organic dissolve */
    const eased  = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const offset = eased * 100;

    paths.forEach(el => { el.style.strokeDashoffset = offset; });

    /* Whole illustration also dims as it undraws */
    illus.style.opacity = 1 - eased * 0.5;
  }
})();

/* ════════════════════════════════════════
   SPOTLIGHT CARDS (cult-ui animated-cards)
   Radial gradient follows cursor per card
════════════════════════════════════════ */
document.querySelectorAll('.carta__item').forEach(card => {
  const spotlight = card.querySelector('.carta__spotlight');
  if (!spotlight) return;

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--cx', `${x}px`);
    card.style.setProperty('--cy', `${y}px`);
  });
});

/* ════════════════════════════════════════
   CARTA TABS
════════════════════════════════════════ */
const tabs  = document.querySelectorAll('.carta__tab');
const items = document.querySelectorAll('.carta__item');

/* Assign per-category stagger index */
const catIdx = {};
items.forEach(item => {
  const cat = item.dataset.category;
  catIdx[cat] = (catIdx[cat] || 0);
  item.style.setProperty('--card-i', catIdx[cat]);
  catIdx[cat]++;
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const cat = tab.dataset.category;
    tabs.forEach(t => t.classList.remove('carta__tab--active'));
    tab.classList.add('carta__tab--active');
    items.forEach(item => {
      const visible = item.dataset.category === cat;
      if (visible) {
        item.classList.remove('carta__item--hidden');
        /* trigger appear animation */
        item.classList.remove('carta__item--appear');
        void item.offsetWidth; /* force reflow */
        item.classList.add('carta__item--appear');
      } else {
        item.classList.add('carta__item--hidden');
        item.classList.remove('carta__item--appear');
      }
    });
  });
});

/* ════════════════════════════════════════
   ANIMATED COUNTERS
   Count up when stats enter viewport
════════════════════════════════════════ */
function animateCounter(el) {
  const end     = parseInt(el.dataset.counter, 10);
  const suffix  = el.dataset.suffix || '';
  const start   = 0;
  const duration = 1600;
  const t0 = performance.now();

  function update(now) {
    const elapsed  = now - t0;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out-cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = Math.round(start + (end - start) * eased);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

/* ════════════════════════════════════════
   REVEAL ANIMATIONS
   Multi-directional (up, left, right)
════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

/* ════════════════════════════════════════
   BUTTON RIPPLE (click feedback)
════════════════════════════════════════ */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.className = 'btn__ripple';
    const rect = btn.getBoundingClientRect();
    ripple.style.setProperty('--rx', `${e.clientX - rect.left}px`);
    ripple.style.setProperty('--ry', `${e.clientY - rect.top}px`);
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});

/* ════════════════════════════════════════
   MAGNETIC BUTTONS
   Subtle cursor attraction on CTAs
════════════════════════════════════════ */
document.querySelectorAll('.btn--magnetic').forEach(btn => {
  const strength = 0.28;

  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const dx   = (e.clientX - (rect.left + rect.width  / 2)) * strength;
    const dy   = (e.clientY - (rect.top  + rect.height / 2)) * strength;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    setTimeout(() => { btn.style.transition = ''; }, 500);
  });
});

/* ════════════════════════════════════════
   PILGRIM ROUTES — canvas intro animation
   Lines converge from all edges toward the
   cathedral, then the SVG landscape draws.
════════════════════════════════════════ */
(function initPilgrimRoutes() {
  const canvas = document.getElementById('introLines');
  if (!canvas) return;

  /* Reduced motion: reveal SVG immediately, skip intro */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('svg-ready');
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  const GOLD = { r: 201, g: 168, b: 76 };
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || (canvas.parentElement && canvas.parentElement.offsetWidth)  || 1280;
    H = canvas.height = canvas.offsetHeight || (canvas.parentElement && canvas.parentElement.offsetHeight) || 680;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* Cathedral sits at roughly (50%, 80%) of the hero */
  const getCenter = () => ({ x: W * 0.50, y: H * 0.80 });

  /* Quadratic Bézier position */
  function bezier(p0x, p0y, cpx, cpy, p2x, p2y, t) {
    const u = 1 - t;
    return {
      x: u * u * p0x + 2 * u * t * cpx + t * t * p2x,
      y: u * u * p0y + 2 * u * t * cpy + t * t * p2y,
    };
  }

  /* Build a stream that originates near/beyond an edge */
  function makeStream(idx, total) {
    const cv  = getCenter();
    const angle = (idx / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.55;
    /* Push start point well beyond the canvas edges */
    const reach = Math.max(W, H) * (0.72 + Math.random() * 0.42);
    const sx  = cv.x + Math.cos(angle) * reach;
    const sy  = cv.y + Math.sin(angle) * reach;
    /* Target lands within a small cluster around the cathedral */
    const tx  = cv.x + (Math.random() - 0.5) * 70;
    const ty  = cv.y + (Math.random() - 0.5) * 50;
    /* Control point deflects the curve slightly for organic feel */
    const cpx = (sx + tx) * 0.5 + (Math.random() - 0.5) * W * 0.22;
    const cpy = (sy + ty) * 0.5 + (Math.random() - 0.5) * H * 0.18;
    const maxLife = 55 + Math.floor(Math.random() * 25);
    return {
      sx, sy, tx, ty, cpx, cpy,
      progress  : 0,
      duration  : 1.5 + Math.random() * 1.6,       /* seconds to travel */
      startDelay: idx * 0.072 + Math.random() * 0.10,
      width     : 0.45 + Math.random() * 1.0,
      maxAlpha  : 0.13 + Math.random() * 0.20,
      trail     : [],
      trailMax  : maxLife,
    };
  }

  const STREAM_N = 28;
  const streams  = Array.from({ length: STREAM_N }, (_, i) => makeStream(i, STREAM_N));

  /* Timeline (ms) */
  const T_ACTIVE      = 3400;   /* all streams running */
  const T_FADE        = 1000;   /* canvas fade-out */
  const T_SVG_TRIGGER = T_ACTIVE * 0.68; /* ~2312ms — add svg-ready class */

  let t0           = null;
  let svgTriggered = false;

  function frame(now) {
    if (!t0) t0 = now;
    const ms  = now - t0;
    const sec = ms / 1000;

    /* Global canvas alpha — full until T_ACTIVE, then fades out */
    let gAlpha = 1;
    if (ms > T_ACTIVE) {
      gAlpha = Math.max(0, 1 - (ms - T_ACTIVE) / T_FADE);
    }

    /* Trigger SVG landscape drawing at ~68% through the intro */
    if (!svgTriggered && ms >= T_SVG_TRIGGER) {
      svgTriggered = true;
      document.documentElement.classList.add('svg-ready');
    }

    /* Stop and hide once the fade is done */
    if (ms > T_ACTIVE + T_FADE + 80) {
      ctx.clearRect(0, 0, W, H);
      canvas.style.display = 'none';
      return;
    }

    ctx.clearRect(0, 0, W, H);

    /* ── Convergence bloom ── */
    const arrivedN = streams.filter(s => s.progress > 0.70).length;
    if (arrivedN > 4) {
      const cv    = getCenter();
      const bloom = Math.min((arrivedN / STREAM_N) * gAlpha, 1);
      const rB    = 40 + bloom * 80;
      const grd   = ctx.createRadialGradient(cv.x, cv.y, 0, cv.x, cv.y, rB);
      grd.addColorStop(0,   `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${0.28 * bloom})`);
      grd.addColorStop(0.4, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${0.10 * bloom})`);
      grd.addColorStop(1,   `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cv.x, cv.y, rB, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ── Draw each stream trail ── */
    streams.forEach(s => {
      if (sec < s.startDelay) return;

      const elapsed = sec - s.startDelay;
      const rawT    = Math.min(elapsed / s.duration, 1);
      /* Ease-out-cubic so head decelerates as it arrives */
      s.progress    = 1 - Math.pow(1 - rawT, 3);

      const pos = bezier(s.sx, s.sy, s.cpx, s.cpy, s.tx, s.ty, s.progress);
      s.trail.push({ x: pos.x, y: pos.y });
      if (s.trail.length > s.trailMax) s.trail.shift();
      if (s.trail.length < 2) return;

      for (let i = 1; i < s.trail.length; i++) {
        const tf    = i / s.trail.length;   /* 0 = tail, 1 = head */
        const alpha = tf * tf * s.maxAlpha * gAlpha;
        const lw    = s.width * (0.12 + tf * 0.88);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgb(${GOLD.r},${GOLD.g},${GOLD.b})`;
        ctx.lineWidth   = lw;
        ctx.lineCap     = 'round';

        /* Soft glow on the leading head segment */
        if (tf > 0.80) {
          ctx.shadowColor = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.85)`;
          ctx.shadowBlur  = 7;
        }

        ctx.beginPath();
        ctx.moveTo(s.trail[i - 1].x, s.trail[i - 1].y);
        ctx.lineTo(s.trail[i].x,     s.trail[i].y);
        ctx.stroke();
        ctx.restore();
      }
    });

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
