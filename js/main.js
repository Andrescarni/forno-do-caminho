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
     OVEN ICON — visible from start, flames hidden.
     Structure (dome, arch, base) shows immediately.
     Only flames are off until ignition.
  ════════════════════════════════════════ */
  const ovenWrap = document.querySelector('.hero__icon-wrap');
  const ovenIcon = document.querySelector('.hero__oven-icon');

  /* Collect flame paths inside the hero SVG */
  let flameEls = [];
  let fireEl   = null;
  if (ovenIcon) {
    flameEls = [...ovenIcon.querySelectorAll('.flame-anim-1, .flame-anim-2, .flame-anim-3')];
    fireEl   = ovenIcon.querySelector('.fire-pulse');

    /* Hide flames: freeze dance animation, collapse from base */
    flameEls.forEach(el => {
      el.style.animation = 'none';
      el.style.opacity   = '0';
      el.style.transform = 'scaleY(0) scaleX(0.5)';
    });
    /* Hide ember glow ellipse */
    if (fireEl) {
      fireEl.style.animation = 'none';
      fireEl.style.opacity   = '0';
    }
  }

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
     IGNITION — triggered by particle arrival
  ════════════════════════════════════════ */
  const sparks    = [];
  let   flashRing = null;
  let   fireGlow  = null;
  let   ignited   = false;

  function spawnSpark(ox, oy) {
    const angle   = Math.random() * Math.PI * 2;
    const speed   = 1.4 + Math.random() * 4.2;
    const maxLife = 28 + Math.floor(Math.random() * 40);
    return {
      x: ox + (Math.random() - 0.5) * 16,
      y: oy + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.4,
      size: 0.8 + Math.random() * 2.2,
      color: HOT_COLORS[Math.floor(Math.random() * HOT_COLORS.length)],
      maxLife, life: maxLife,
    };
  }

  function triggerIgnition() {
    if (ignited) return;
    ignited = true;

    const { x: ox, y: oy } = ovenPos();

    /* Canvas: spark burst + flash ring + warm glow */
    for (let i = 0; i < 52; i++) sparks.push(spawnSpark(ox, oy));
    flashRing = { x: ox, y: oy, r: 4, maxR: 80, life: 26, maxLife: 26 };
    fireGlow  = { x: ox, y: oy, born: performance.now() };

    /* Brief over-bright flash on the whole oven icon */
    if (ovenIcon) {
      ovenIcon.style.filter =
        'drop-shadow(0 0 30px rgba(255,185,55,.95)) drop-shadow(0 0 60px rgba(255,100,10,.4)) brightness(1.7)';
      setTimeout(() => { ovenIcon.style.filter = ''; }, 480);
    }

    /* Grow flames in from base — staggered so it feels organic */
    flameEls.forEach((el, i) => {
      const naturalOpacity = el.getAttribute('opacity') || '1';
      setTimeout(() => {
        el.style.transition = 'opacity 0.45s ease-out, transform 0.55s cubic-bezier(0.34, 1.3, 0.64, 1)';
        el.style.opacity    = naturalOpacity;
        el.style.transform  = 'scaleY(1) scaleX(1)';
        /* After grow-in completes, hand control back to flameDance CSS animation */
        setTimeout(() => {
          el.style.transition = '';
          el.style.opacity    = '';
          el.style.transform  = '';
          el.style.animation  = '';
        }, 620);
      }, i * 120);
    });

    /* Fade in ember glow at base */
    if (fireEl) {
      const naturalOpacity = fireEl.getAttribute('opacity') || '0.22';
      fireEl.style.transition = 'opacity 0.7s ease-out';
      fireEl.style.opacity    = naturalOpacity;
      setTimeout(() => {
        fireEl.style.transition = '';
        fireEl.style.opacity    = '';
        fireEl.style.animation  = '';
      }, 780);
    }
  }

  /* ════════════════════════════════════════
     CONVERGING PARTICLES
     28 embers arrive one by one over ~8 s.
     Ignition fires when 80 % have arrived.
  ════════════════════════════════════════ */
  const CONV_N  = 28;
  const conv    = [];
  let   convDone = 0;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const { x: ox, y: oy } = ovenPos();

    for (let i = 0; i < CONV_N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 240 + Math.random() * Math.max(canvas.width, canvas.height) * 0.55;
      const sx    = ox + Math.cos(angle) * dist;
      const sy    = oy + Math.sin(angle) * dist;

      conv.push({
        sx, sy,
        tx: ox + (Math.random() - 0.5) * 20,
        ty: oy + (Math.random() - 0.5) * 14,
        x: sx, y: sy,
        progress: 0,
        /* travel: each particle takes ~0.5–1 s to cross */
        speed: 0.012 + Math.random() * 0.010,
        /* stagger: full set launches over ~2.5 s */
        frameDelay: Math.floor(i * 5 + Math.random() * 3),
        size: 1.0 + Math.random() * 2.2,
        color: HOT_COLORS[Math.floor(Math.random() * HOT_COLORS.length)],
        /* longer trail = more cinematic streak */
        trail: [],
        trailMax: 14,
        done: false,
      });
    }
  }));

  /* ════════════════════════════════════════
     AMBIENT EMBERS — continuous, very subtle
  ════════════════════════════════════════ */
  const MAX = 38;
  function spawnEmber(randomY) {
    const cx = Math.random() * canvas.width;
    const cy = randomY
      ? Math.random() * canvas.height
      : canvas.height * (0.75 + Math.random() * 0.25);
    const maxLife = 140 + Math.random() * 200;
    return {
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(0.35 + Math.random() * 1.0),
      size: 0.4 + Math.random() * 1.3,
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

      /* Smooth ease-in: slow start, accelerates toward oven */
      p.progress += p.speed * (1 + p.progress * p.progress * 3);
      if (p.progress >= 1) {
        p.done = true;
        convDone++;
        /* Fire ignition when 80 % of particles have landed */
        if (!ignited && convDone >= Math.ceil(CONV_N * 0.80)) triggerIgnition();
        continue;
      }

      const eased = p.progress * p.progress;
      p.x = p.sx + (p.tx - p.sx) * eased;
      p.y = p.sy + (p.ty - p.sy) * eased;

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > p.trailMax) p.trail.shift();

      const [cr, cg, cb] = p.color;
      /* fade in gently at start, fade out slightly near target */
      const alpha = Math.min(p.progress * 4, 1) * (1 - eased * 0.35);

      /* trail — long glowing streak */
      ctx.save();
      for (let i = 1; i < p.trail.length; i++) {
        const tf = i / p.trail.length;
        ctx.globalAlpha = tf * alpha * 0.5;
        ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
        ctx.shadowBlur  = p.size * 4;
        ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
        ctx.lineWidth   = p.size * tf * 0.75;
        ctx.beginPath();
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
        ctx.lineTo(p.trail[i].x,     p.trail[i].y);
        ctx.stroke();
      }
      ctx.restore();

      /* head dot */
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur  = p.size * 8;
      ctx.fillStyle   = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(p.size * (1 - eased * 0.5), 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ── 2. Warm oven glow (after ignition) ── */
    if (fireGlow) {
      const ms     = performance.now() - fireGlow.born;
      const raw    = Math.min(ms / 1200, 1);
      /* sharp burst peak then settle into steady warmth */
      const burst  = raw < 0.25 ? raw / 0.25 : 1 - (raw - 0.25) / 0.75 * 0.5;
      const steady = Math.max(burst, 0.42);
      const flk    = Math.sin(ms * 0.006) * 0.07 + Math.sin(ms * 0.019) * 0.04;
      const fin    = Math.max(0, steady + flk);
      const rad    = 40 + burst * 52;

      const g = ctx.createRadialGradient(
        fireGlow.x, fireGlow.y, 0,
        fireGlow.x, fireGlow.y, rad
      );
      g.addColorStop(0,   `rgba(255,205,75,${(fin * 0.40).toFixed(3)})`);
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
      ctx.strokeStyle = 'rgb(255,215,95)';
      ctx.lineWidth   = 2.2 * ft;
      ctx.shadowColor = 'rgb(255,170,30)';
      ctx.shadowBlur  = 20 * ft;
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
      s.vx *= 0.94; s.vy += 0.08;
      s.life--;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const t = s.life / s.maxLife;
      const [cr, cg, cb] = s.color;
      ctx.save();
      ctx.globalAlpha = t * 0.92;
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
      p.x += p.vx + Math.sin(p.phase) * 0.35;
      p.y += p.vy;
      p.vy -= 0.006;
      p.life--;
      if (p.life <= 0 || p.y < -12) { embers[i] = spawnEmber(false); continue; }
      const t = p.life / p.maxLife;
      const alpha = t > 0.85 ? (1 - t) / 0.15 : t < 0.2 ? t / 0.2 : 1;
      const flicker = 0.72 + Math.sin(p.phase * 4.3) * 0.28;
      const r = p.size * flicker;
      const [cr, cg, cb] = p.color;
      ctx.save();
      ctx.globalAlpha = alpha * 0.34;
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
