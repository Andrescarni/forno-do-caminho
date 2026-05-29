'use strict';

/* ════════════════════════════════════════
   MENU DATA
════════════════════════════════════════ */
const MENU = {
  pizzas: [
    {
      id: 'margherita',
      name: 'Margherita',
      description: 'Salsa de tomate San Marzano, mozzarella fior di latte, albahaca fresca',
      price: 9.50,
      category: 'classicas',
      tags: ['Vegetariana'],
    },
    {
      id: 'napolitana',
      name: 'Napolitana',
      description: 'Salsa de tomate, mozzarella, anchoas, alcaparras, aceitunas negras, orégano',
      price: 10.50,
      category: 'classicas',
      tags: [],
    },
    {
      id: 'prosciutto',
      name: 'Prosciutto',
      description: 'Salsa de tomate, mozzarella, jamón crudo, rúcula, parmesano en lascas',
      price: 12.00,
      category: 'classicas',
      tags: [],
    },
    {
      id: 'quattro-stagioni',
      name: 'Quattro Stagioni',
      description: 'Salsa de tomate, mozzarella, champiñones, jamón, alcachofas y aceitunas',
      price: 13.00,
      category: 'classicas',
      tags: [],
    },
    {
      id: 'caminho',
      name: 'Caminho',
      description: 'Nuestra firma. Salsa de tomate, mozzarella, nduja, miel de romero, nuez y rúcula',
      price: 14.50,
      category: 'especiais',
      tags: ['Chef\'s Pick'],
      highlight: true,
    },
    {
      id: 'trufada',
      name: 'Trufada',
      description: 'Base de crema de trufa, mozzarella, setas silvestres, parmesano y aceite trufado',
      price: 15.50,
      category: 'especiais',
      tags: ['Sin tomate'],
    },
    {
      id: 'alheira',
      name: 'Alheira',
      description: 'Salsa de tomate, mozzarella, alheira artesanal, pimiento asado y berza gallega',
      price: 13.50,
      category: 'especiais',
      tags: ['Sabor portugués'],
    },
    {
      id: 'burrata',
      name: 'Burrata',
      description: 'Salsa de tomate cherry, burrata fresca, tomate cherry, albahaca y aceite de oliva virgen extra',
      price: 15.00,
      category: 'especiais',
      tags: ['Vegetariana'],
    },
  ],

  bebidas: [
    { id: 'agua', name: 'Agua mineral', description: '50cl — Agua natural o con gas', price: 1.50 },
    { id: 'refresco', name: 'Refresco', description: '33cl — Cola, naranja o limón', price: 2.50 },
    { id: 'cerveza', name: 'Cerveza artesanal', description: '33cl — Selección artesanal local', price: 3.50 },
    { id: 'vino', name: 'Vino tinto', description: 'Copa 15cl — Vino de la región', price: 4.00 },
    { id: 'limonada', name: 'Limonada casera', description: 'Con menta y jengibre', price: 3.00 },
  ],

  extras: [
    { id: 'mozzarella-extra', name: 'Mozzarella extra', price: 1.50 },
    { id: 'jamon-crudo',      name: 'Jamón crudo',      price: 2.00 },
    { id: 'rucula',           name: 'Rúcula fresca',    price: 1.00 },
    { id: 'aceitunas',        name: 'Aceitunas negras', price: 1.00 },
    { id: 'anchoas',          name: 'Anchoas',           price: 1.50 },
    { id: 'trufa',            name: 'Aceite de trufa',  price: 2.50 },
    { id: 'huevo',            name: 'Huevo',             price: 1.00 },
    { id: 'pimientos',        name: 'Pimientos asados', price: 1.00 },
    { id: 'parmesano',        name: 'Parmesano',         price: 1.50 },
    { id: 'sin-gluten',       name: 'Masa sin gluten',  price: 2.00 },
  ],
};

/* ════════════════════════════════════════
   HELPERS
════════════════════════════════════════ */
function fmt(n) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ════════════════════════════════════════
   CART STORE
   Reactive state backed by localStorage.
════════════════════════════════════════ */
const Cart = (() => {
  const KEY = 'forno_cart';
  let items = [];
  const listeners = new Set();

  function load() {
    try { items = JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { items = []; }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  function emit() {
    save();
    listeners.forEach(fn => fn([...items]));
  }

  load();

  return {
    subscribe(fn)  { listeners.add(fn); fn([...items]); },
    unsubscribe(fn){ listeners.delete(fn); },

    add(item) {
      items.push({ ...item, _id: uid() });
      emit();
    },

    remove(_id) {
      items = items.filter(i => i._id !== _id);
      emit();
    },

    setQty(_id, qty) {
      const item = items.find(i => i._id === _id);
      if (!item) return;
      if (qty < 1) { this.remove(_id); return; }
      item.quantity = qty;
      emit();
    },

    clear() { items = []; emit(); },

    get count()  { return items.reduce((n, i) => n + i.quantity, 0); },
    get total()  {
      return items.reduce((sum, i) => {
        const ext = i.extras.reduce((s, e) => s + e.price, 0);
        return sum + (i.price + ext) * i.quantity;
      }, 0);
    },
    get all()    { return [...items]; },
    get isEmpty(){ return items.length === 0; },
  };
})();

/* ════════════════════════════════════════
   PIZZA CUSTOMIZATION MODAL
════════════════════════════════════════ */
const PizzaModal = (() => {
  let currentPizza = null;
  let selectedExtras = [];
  let qty = 1;

  const modal     = document.getElementById('pizzaModal');
  const backdrop  = modal?.querySelector('.modal__backdrop');
  const title     = document.getElementById('modalTitle');
  const desc      = document.getElementById('modalDesc');
  const basePrice = document.getElementById('modalBasePrice');
  const extrasEl  = document.getElementById('modalExtras');
  const qtyMinus  = document.getElementById('qtyMinus');
  const qtyPlus   = document.getElementById('qtyPlus');
  const qtyVal    = document.getElementById('qtyValue');
  const totalEl   = document.getElementById('modalTotal');
  const addBtn    = document.getElementById('modalAddBtn');

  if (!modal) return { open() {} };

  function calcTotal() {
    const extrasSum = selectedExtras.reduce((s, e) => s + e.price, 0);
    return (currentPizza.price + extrasSum) * qty;
  }

  function updateTotal() {
    totalEl.textContent = fmt(calcTotal());
    qtyVal.textContent  = qty;
  }

  function renderExtras() {
    extrasEl.innerHTML = MENU.extras.map(e => `
      <label class="extra-option" data-id="${e.id}">
        <input type="checkbox" class="extra-option__check" value="${e.id}">
        <span class="extra-option__name">${e.name}</span>
        <span class="extra-option__price">+${fmt(e.price)}</span>
      </label>
    `).join('');

    extrasEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const extra = MENU.extras.find(e => e.id === cb.value);
        if (cb.checked) {
          selectedExtras.push(extra);
          cb.closest('.extra-option').classList.add('extra-option--selected');
        } else {
          selectedExtras = selectedExtras.filter(e => e.id !== cb.value);
          cb.closest('.extra-option').classList.remove('extra-option--selected');
        }
        updateTotal();
      });
    });
  }

  function open(pizza) {
    currentPizza   = pizza;
    selectedExtras = [];
    qty            = 1;

    title.textContent     = pizza.name;
    desc.textContent      = pizza.description;
    basePrice.textContent = fmt(pizza.price);

    renderExtras();
    updateTotal();

    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('.modal__panel').focus(), 50);
  }

  function close() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  function addToCart() {
    Cart.add({
      type:        'pizza',
      id:          currentPizza.id,
      name:        currentPizza.name,
      price:       currentPizza.price,
      quantity:    qty,
      extras:      [...selectedExtras],
    });
    close();
    CartDrawer.open();
  }

  qtyMinus?.addEventListener('click', () => { if (qty > 1) { qty--; updateTotal(); } });
  qtyPlus?.addEventListener('click',  () => { qty++; updateTotal(); });
  addBtn?.addEventListener('click',   addToCart);
  backdrop?.addEventListener('click', close);
  modal?.querySelector('.modal__close')?.addEventListener('click', close);
  modal?.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  return { open, close };
})();

/* ════════════════════════════════════════
   BEBIDA QUICK-ADD (inline quantity popup)
════════════════════════════════════════ */
function quickAddBebida(bebida, triggerEl) {
  Cart.add({
    type:     'bebida',
    id:       bebida.id,
    name:     bebida.name,
    price:    bebida.price,
    quantity: 1,
    extras:   [],
  });

  /* Brief "Añadido" feedback on the button */
  const btn = triggerEl.closest('.carta__item')?.querySelector('.carta__add-btn');
  if (btn) {
    btn.textContent = '✓ Añadido';
    btn.classList.add('carta__add-btn--added');
    setTimeout(() => {
      btn.textContent = 'Añadir';
      btn.classList.remove('carta__add-btn--added');
    }, 1200);
  }

  CartDrawer.open();
}

/* ════════════════════════════════════════
   CART DRAWER
════════════════════════════════════════ */
const CartDrawer = (() => {
  const drawer   = document.getElementById('cartDrawer');
  const backdrop = drawer?.querySelector('.cart-drawer__backdrop');
  const itemsEl  = document.getElementById('cartItems');
  const emptyEl  = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const subtotal = document.getElementById('cartSubtotal');
  const totalEl  = document.getElementById('cartTotal');
  const floatTot = document.getElementById('cartFloatTotal');
  const checkBtn = document.getElementById('checkoutBtn');
  const chkTotal = document.getElementById('checkoutTotal');

  if (!drawer) return { open() {}, close() {} };

  function renderItems(items) {
    if (items.length === 0) {
      itemsEl.innerHTML = '';
      emptyEl.hidden    = false;
      footerEl.hidden   = true;
      return;
    }
    emptyEl.hidden  = false ? true : true;
    emptyEl.hidden  = true;
    footerEl.hidden = false;

    itemsEl.innerHTML = items.map(item => {
      const extrasSum  = item.extras.reduce((s, e) => s + e.price, 0);
      const lineTotal  = (item.price + extrasSum) * item.quantity;
      const extraNames = item.extras.map(e => e.name).join(', ');

      return `
        <div class="cart-item" data-id="${item._id}">
          <div class="cart-item__info">
            <span class="cart-item__name">${item.name}</span>
            ${extraNames ? `<span class="cart-item__extras">${extraNames}</span>` : ''}
          </div>
          <div class="cart-item__controls">
            <div class="cart-item__qty">
              <button class="cart-qty__btn" data-action="minus" data-id="${item._id}" aria-label="Quitar uno">−</button>
              <span class="cart-qty__val">${item.quantity}</span>
              <button class="cart-qty__btn" data-action="plus"  data-id="${item._id}" aria-label="Añadir uno">+</button>
            </div>
            <span class="cart-item__price">${fmt(lineTotal)}</span>
            <button class="cart-item__remove" data-id="${item._id}" aria-label="Eliminar">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
                <path d="M3 3l10 10M13 3L3 13"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    /* Event delegation for qty buttons and remove */
    itemsEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.id;
        const item = Cart.all.find(i => i._id === id);
        if (!item) return;
        if (btn.dataset.action === 'minus') Cart.setQty(id, item.quantity - 1);
        if (btn.dataset.action === 'plus')  Cart.setQty(id, item.quantity + 1);
      });
    });

    itemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () => Cart.remove(btn.dataset.id));
    });
  }

  function updateTotals() {
    const t = Cart.total;
    if (subtotal) subtotal.textContent = fmt(t);
    if (totalEl)  totalEl.textContent  = fmt(t);
    if (floatTot) floatTot.textContent = fmt(t);
    if (chkTotal) chkTotal.textContent = fmt(t);
  }

  /* Reactive update */
  Cart.subscribe(items => {
    renderItems(items);
    updateTotals();
    updateFloatBtn(items);
  });

  function open() {
    drawer.classList.add('cart-drawer--open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawer.classList.remove('cart-drawer--open');
    document.body.style.overflow = '';
  }

  backdrop?.addEventListener('click', close);
  drawer?.querySelector('.cart-drawer__close')?.addEventListener('click', close);
  drawer?.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.getElementById('cartEmptyCta')?.addEventListener('click', () => {
    close();
    document.getElementById('carta')?.scrollIntoView({ behavior: 'smooth' });
  });

  /* Checkout */
  checkBtn?.addEventListener('click', async () => {
    if (Cart.isEmpty) return;

    const name  = document.getElementById('customerName')?.value?.trim();
    const note  = document.getElementById('orderNote')?.value?.trim();

    if (!name) {
      document.getElementById('customerName')?.focus();
      document.getElementById('customerName')?.classList.add('input--error');
      return;
    }

    checkBtn.disabled    = true;
    checkBtn.textContent = 'Preparando pago…';

    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: Cart.all, customerName: name, note }),
      });

      if (!res.ok) throw new Error('Error creando sesión');
      const { url } = await res.json();
      window.location.href = url;

    } catch (err) {
      checkBtn.disabled    = false;
      checkBtn.textContent = 'Error — inténtalo de nuevo';
      setTimeout(() => {
        checkBtn.textContent = `Pagar con tarjeta · ${fmt(Cart.total)}`;
      }, 3000);
    }
  });

  document.getElementById('customerName')?.addEventListener('input', e => {
    e.target.classList.remove('input--error');
  });

  return { open, close };
})();

/* ════════════════════════════════════════
   FLOATING CART BUTTON
════════════════════════════════════════ */
const floatBtn  = document.getElementById('cartFloat');
const floatOpen = document.getElementById('cartFloatOpen');

function updateFloatBtn(items) {
  if (!floatBtn) return;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  floatBtn.hidden = count === 0;
  const badge = floatBtn.querySelector('.cart-float__count');
  if (badge) badge.textContent = count;
}

floatOpen?.addEventListener('click', () => CartDrawer.open());

/* ════════════════════════════════════════
   CARTA — BUILD + WIRE UP
   Generates carta cards from MENU data
   and wires Add-to-cart interactions.
════════════════════════════════════════ */
(function buildCarta() {
  const grid = document.getElementById('cartaGrid');
  if (!grid) return;

  /* Build pizza cards */
  const pizzaCards = MENU.pizzas.map(pizza => {
    const tagHtml = pizza.tags.map(t =>
      `<span class="carta__item-tag${pizza.highlight ? ' carta__item-tag--gold' : ''}">${t}</span>`
    ).join('');

    return `
      <div class="carta__item${pizza.category === 'especiais' ? ' carta__item--hidden' : ''}"
           data-category="${pizza.category}"
           data-item-id="${pizza.id}"
           data-item-type="pizza">
        <div class="carta__spotlight" aria-hidden="true"></div>
        <div class="carta__item-header">
          <h3 class="carta__item-name">${pizza.name}</h3>
          <span class="carta__item-price">${fmt(pizza.price)}</span>
        </div>
        <p class="carta__item-desc">${pizza.description}</p>
        ${tagHtml}
        <button class="carta__add-btn" aria-label="Añadir ${pizza.name} al carrito">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
            <path d="M8 2v12M2 8h12"/>
          </svg>
          Añadir
        </button>
      </div>
    `;
  }).join('');

  /* Build bebida cards */
  const bebidaCards = MENU.bebidas.map(b => `
    <div class="carta__item carta__item--hidden"
         data-category="bebidas"
         data-item-id="${b.id}"
         data-item-type="bebida">
      <div class="carta__spotlight" aria-hidden="true"></div>
      <div class="carta__item-header">
        <h3 class="carta__item-name">${b.name}</h3>
        <span class="carta__item-price">${fmt(b.price)}</span>
      </div>
      <p class="carta__item-desc">${b.description}</p>
      <button class="carta__add-btn" aria-label="Añadir ${b.name} al carrito">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
          <path d="M8 2v12M2 8h12"/>
        </svg>
        Añadir
      </button>
    </div>
  `).join('');

  grid.innerHTML = pizzaCards + bebidaCards;

  /* Tabs — update to include bebidas */
  const tabsEl = document.querySelector('.carta__tabs');
  if (tabsEl) {
    tabsEl.innerHTML = `
      <button class="carta__tab carta__tab--active" data-category="classicas">Clásicas</button>
      <button class="carta__tab" data-category="especiais">Especiales</button>
      <button class="carta__tab" data-category="bebidas">Bebidas</button>
    `;
  }

  /* Re-wire tab logic (overrides main.js version) */
  const tabs  = document.querySelectorAll('.carta__tab');
  const items = () => document.querySelectorAll('.carta__item');
  const catIdx = {};

  items().forEach(item => {
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
      items().forEach(item => {
        const visible = item.dataset.category === cat;
        item.classList.toggle('carta__item--hidden', !visible);
        if (visible) {
          item.classList.remove('carta__item--appear');
          void item.offsetWidth;
          item.classList.add('carta__item--appear');
        }
      });
    });
  });

  /* Spotlight (re-wire for newly created cards) */
  document.querySelectorAll('.carta__item').forEach(card => {
    const spotlight = card.querySelector('.carta__spotlight');
    if (!spotlight) return;
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--cx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--cy', `${e.clientY - rect.top}px`);
    });
  });

  /* Add-to-cart wiring */
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.carta__add-btn');
    if (!btn) return;

    const card   = btn.closest('.carta__item');
    const type   = card.dataset.itemType;
    const itemId = card.dataset.itemId;

    if (type === 'pizza') {
      const pizza = MENU.pizzas.find(p => p.id === itemId);
      if (pizza) PizzaModal.open(pizza);

    } else if (type === 'bebida') {
      const bebida = MENU.bebidas.find(b => b.id === itemId);
      if (bebida) quickAddBebida(bebida, btn);
    }
  });
})();
