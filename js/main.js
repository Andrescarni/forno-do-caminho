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

  const EMBER_COLORS = [
    [201, 168, 76], [228, 201, 122], [245, 166, 35],
    [255, 200, 80],  [255, 245, 200], [255, 130, 20],
  ];
  const HOT_COLORS = [
    [255, 255, 230], [255, 230, 140], [255, 180, 60],
    [255, 120, 20],  [201, 168, 76],
  ];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ════════════════════════════════════════
     OVEN ICON — starts off, lights up on ignition
  ════════════════════════════════════════ */
  const ovenWrap = document.querySelector('.hero__icon-wrap');
  const ovenIcon = document.querySelector('.hero__oven-icon');
  if (ovenWrap) {
    ovenWrap.style.opacity   = '0';
    ovenWrap.style.animation = 'none';
  }
  if (ovenIcon) ovenIcon.style.animation = 'none';

  /* Real oven canvas position (getBoundingClientRect works even at opacity 0) */
  function ovenPos() {
    if (ovenWrap) {
      const wr = ovenWrap.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      if (wr.width > 0) return {
        x: wr.left + wr.width  / 2 - cr.left,
        y: wr.top  + wr.height / 2 - cr.top,
      };
    }
    return { x: canvas.width * 0.5, y: canvas.height * 0.28 };
  }

  /* ════════════════════════════════════════
     CONVERGING PARTICLES
     Stream from all directions toward the
     oven icon. When they arrive (600 ms)
     the oven ignites.
  ════════════════════════════════════════ */
  const conv = [];

  /* Build after two rAF frames so layout is ready */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const { x: ox, y: oy } = ovenPos();
    for (let i = 0; i < 42; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 200 + Math.random() * Math.max(canvas.width, canvas.height) * 0.52;
      const sx    = ox + Math.cos(angle) * dist;
      const sy    = oy + Math.sin(angle) * dist;
      conv.push({
        sx, sy,
        tx: ox + (Math.random() - 0.5) * 18,
        ty: oy + (Math.random() - 0.5) * 12,
        x: sx, y: sy,
        progress: 0,
        speed: 0.022 + Math.random() * 0.026,  /* arrive in ~15–25 frames */
        frameDelay: Math.floor(i * 2.5),        /* stagger over ~105 frames */
        size: 0.8 + Math.random() * 2.0,
        color: HOT_COLORS[Math.floor(Math.random() * HOT_COLORS.length)],
        trail: [],
        done: false,
      });
    }
  }));

  /* ════════════════════════════════════════
     IGNITION — fires at 700 ms
  ════════════════════════════════════════ */
  const sparks    = [];
  let   flashRing = null;
  let   fireGlow  = null;

  function spawnSpark(ox, oy) {
    const angle   = Math.random() * Math.PI * 2;
    const speed   = 1.8 + Math.random() * 5.5;
    const maxLife = 22 + Math.floor(Math.random() * 32);
    return {
      x: ox + (Math.random() - 0.5) * 18,
      y: oy + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8,
      size: 0.9 + Math.random() * 2.6,
      color: HOT_COLORS[Math.floor(Math.random() * HOT_COLORS.length)],
      maxLife, life: maxLife,
    };
  }

  setTimeout(() => {
    const { x: ox, y: oy } = ovenPos();

    /* spark burst */
    for (let i = 0; i < 58; i++) sparks.push(spawnSpark(ox, oy));
    flashRing = { x: ox, y: oy, r: 4, maxR: 72, life: 22, maxLife: 22 };
    fireGlow  = { x: ox, y: oy, born: performance.now() };

    /* light up the oven icon */
    if (ovenWrap) {
      ovenWrap.style.transition = 'opacity 0.08s ease-out';
      ovenWrap.style.opacity    = '1';
      /* brief over-bright flash */
      ovenWrap.style.filter =
        'brightness(2.6) drop-shadow(0 0 26px rgba(255,185,55,.95))';
      setTimeout(() => {
        ovenWrap.style.filter     = '';
        ovenWrap.style.transition = '';
      }, 380);
    }
    if (ovenIcon) {
      /* restore float animation */
      ovenIcon.style.animation = '';
    }
  }, 700);

  /* ════════════════════════════════════════
     AMBIENT EMBERS — continuous, subtle
  ════════════════════════════════════════ */
  const MAX = 42;
  function spawnEmber(randomY) {
    const cx = Math.random() * canvas.width;
    const cy = randomY
      ? Math.random() * canvas.height
      : canvas.height * (0.75 + Math.random() * 0.25);
    const maxLife = 140 + Math.random() * 200;
    return {
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 0.55,
      vy: -(0.4 + Math.random() * 1.1),
      size: 0.4 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.03 + Math.random() * 0.04,
      color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
      maxLife,
      life: randomY ? Math.random() * maxLife : maxLife,
    };
  }
  const embers = Array.from({ length: MAX }, () => spawnEmber(true));

  /* ════════════════════════════════════════
     MAIN LOOP
  ════════════════════════════════════════ */
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* ── 1. Converging streaks → oven ── */
    for (const p of conv) {
      if (p.done) continue;
      if (p.frameDelay > 0) { p.frameDelay--; continue; }

      p.progress += p.speed * (1 + p.progress * 2); /* ease-in: accelerates */
      if (p.progress >= 1) { p.done = true; continue; }

      const eased = p.progress * p.progress;
      p.x = p.sx + (p.tx - p.sx) * eased;
      p.y = p.sy + (p.ty - p.sy) * eased;

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 7) p.trail.shift();

      const [cr, cg, cb] = p.color;
      const alpha = Math.min(p.progress * 5, 1) * (1 - eased * 0.4);

      /* trail */
      ctx.save();
      for (let i = 1; i < p.trail.length; i++) {
        ctx.globalAlpha = (i / p.trail.length) * alpha * 0.45;
        ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
        ctx.shadowBlur  = p.size * 3;
        ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
        ctx.lineWidth   = p.size * (i / p.trail.length) * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
        ctx.lineTo(p.trail[i].x,     p.trail[i].y);
        ctx.stroke();
      }
      ctx.restore();

      /* head */
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur  = p.size * 6;
      ctx.fillStyle   = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(p.size * (1 - eased * 0.6), 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ── 2. Warm oven glow — no tall flame, just radiant heat ── */
    if (fireGlow) {
      const ms  = performance.now() - fireGlow.born;
      /* fast burst then settle to steady warmth */
      const raw = Math.min(ms / 900, 1);
      const burst   = raw < 0.3 ? raw / 0.3 : 1 - (raw - 0.3) / 0.7 * 0.55;
      const steady  = Math.max(burst, 0.45);
      const flk     = Math.sin(ms * 0.007) * 0.08 + Math.sin(ms * 0.021) * 0.05;
      const fin     = Math.max(0, steady + flk);
      const rad     = 38 + burst * 48;

      const g = ctx.createRadialGradient(
        fireGlow.x, fireGlow.y, 0,
        fireGlow.x, fireGlow.y, rad
      );
      g.addColorStop(0,   `rgba(255,205,75,${(fin * 0.38).toFixed(3)})`);
      g.addColorStop(0.4, `rgba(255,88,14,${(fin * 0.18).toFixed(3)})`);
      g.addColorStop(1,   'rgba(200,30,0,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fireGlow.x, fireGlow.y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ── 3. Flash ring ── */
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

    /* ── 4. Sparks ── */
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x  += s.vx; s.y += s.vy;
      s.vx *= 0.93; s.vy += 0.09;
      s.life--;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const t = s.life / s.maxLife;
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

    /* ── 5. Ambient embers ── */
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      p.phase += p.phaseSpeed;
      p.x += p.vx + Math.sin(p.phase) * 0.38;
      p.y += p.vy;
      p.vy -= 0.007;
      p.life--;
      if (p.life <= 0 || p.y < -12) { embers[i] = spawnEmber(false); continue; }
      const t = p.life / p.maxLife;
      const alpha = t > 0.85 ? (1 - t) / 0.15 : t < 0.2 ? t / 0.2 : 1;
      const flicker = 0.72 + Math.sin(p.phase * 4.3) * 0.28;
      const r = p.size * flicker;
      const [cr, cg, cb] = p.color;
      ctx.save();
      ctx.globalAlpha = alpha * 0.36;
      ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur  = r * 3;
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
   SVG READY TRIGGER
   Activates the SVG landscape draw
   animations after a short delay.
════════════════════════════════════════ */
(function initSvgTrigger() {
  const canvas = document.getElementById('introLines');
  if (canvas) canvas.style.display = 'none';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('svg-ready');
    return;
  }

  /* Match original ~2300ms timing so SVG draws at the same moment */
  setTimeout(() => {
    document.documentElement.classList.add('svg-ready');
  }, 2300);
})();
