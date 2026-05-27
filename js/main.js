'use strict';

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
  const MAX = 48;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function spawn(randomY) {
    const cx = canvas.width  * (0.38 + Math.random() * 0.24);
    const cy = randomY
      ? Math.random() * canvas.height
      : canvas.height * (0.82 + Math.random() * 0.12);
    const maxLife = 140 + Math.random() * 200;
    return {
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 0.55,
      vy: -(0.4 + Math.random() * 1.1),
      size: 0.6 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.03 + Math.random() * 0.04,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      maxLife,
      life: randomY ? Math.random() * maxLife : maxLife,
    };
  }

  const particles = Array.from({ length: MAX }, () => spawn(true));

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
      // fast fade-in, hold, ease-out fade
      const alpha = t > 0.85 ? (1 - t) / 0.15
                  : t < 0.2  ? t / 0.2
                  : 1;
      const flicker = 0.72 + Math.sin(p.phase * 4.3) * 0.28;
      const r = p.size * flicker;
      const [cr, cg, cb] = p.color;

      ctx.save();
      ctx.globalAlpha = alpha * 0.88;
      ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur  = r * 5;
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
   TRUST BAND MARQUEE — DUPLICATE ITEMS
════════════════════════════════════════ */
(function initMarquee() {
  const runner = document.getElementById('trustRunner');
  if (!runner) return;
  const row = runner.querySelector('.trust-row');
  if (!row) return;
  const clone = row.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  runner.appendChild(clone);
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

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const cat = tab.dataset.category;
    tabs.forEach(t => t.classList.remove('carta__tab--active'));
    tab.classList.add('carta__tab--active');
    items.forEach(item => {
      item.classList.toggle('carta__item--hidden', item.dataset.category !== cat);
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
