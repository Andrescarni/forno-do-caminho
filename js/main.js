// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 60);
}, { passive: true });

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('nav__links--open');
  navToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

navLinks.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('nav__links--open');
    document.body.style.overflow = '';
  });
});

// Carta tabs
const tabs     = document.querySelectorAll('.carta__tab');
const items    = document.querySelectorAll('.carta__item');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const category = tab.dataset.category;

    tabs.forEach(t => t.classList.remove('carta__tab--active'));
    tab.classList.add('carta__tab--active');

    items.forEach(item => {
      if (item.dataset.category === category) {
        item.classList.remove('carta__item--hidden');
      } else {
        item.classList.add('carta__item--hidden');
      }
    });
  });
});

// Fade-in on scroll
const fadeEls = document.querySelectorAll(
  '.section__header, .historia__visual, .historia__content, .step, .info-block, .carta__item, .trust-item'
);

fadeEls.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver(
  entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

fadeEls.forEach(el => observer.observe(el));
