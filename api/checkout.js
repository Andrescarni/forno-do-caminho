// Vercel serverless function — POST /api/checkout
// Creates a Stripe Checkout session from cart items.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, customerName, note, customerEmail } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Carrito vacío' });
  }

  const origin = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    /* Build Stripe line items */
    const lineItems = items.map(item => {
      const extrasSum  = item.extras.reduce((s, e) => s + e.price, 0);
      const unitPrice  = Math.round((item.price + extrasSum) * 100); // céntimos
      const extrasDesc = item.extras.length > 0
        ? `+ ${item.extras.map(e => e.name).join(', ')}`
        : '';

      return {
        price_data: {
          currency:     'eur',
          unit_amount:  unitPrice,
          product_data: {
            name:        item.name,
            description: extrasDesc || undefined,
          },
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode:        'payment',
      line_items:  lineItems,
      currency:    'eur',

      /* Pre-fill customer data */
      ...(customerEmail && { customer_email: customerEmail }),

      /* Order metadata stored for webhook */
      metadata: {
        customerName: customerName || 'Cliente',
        note:         note         || '',
        items:        JSON.stringify(items.map(i => ({
          id:       i.id,
          name:     i.name,
          qty:      i.quantity,
          extras:   i.extras.map(e => e.name),
        }))),
      },

      success_url: `${origin}/pedido-confirmado?session={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/#carta`,

      /* Appearance */
      payment_intent_data: {
        description: `Pedido Forno do Caminho — ${customerName || 'Cliente'}`,
      },
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('[checkout]', err.message);
    res.status(500).json({ error: 'Error al crear la sesión de pago' });
  }
};
