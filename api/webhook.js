// Vercel serverless function — POST /api/webhook
// Handles Stripe webhook events: saves confirmed orders to Supabase.

const stripe        = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* Vercel: disable body parsing so we can verify Stripe signature */
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  /* Read raw body */
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature invalid' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta    = session.metadata;

    let items = [];
    try { items = JSON.parse(meta.items || '[]'); } catch {}

    const { error } = await supabase.from('orders').insert({
      stripe_session_id: session.id,
      customer_name:     meta.customerName || 'Cliente',
      customer_email:    session.customer_email || null,
      items,
      note:              meta.note || null,
      total:             session.amount_total / 100,
      status:            'pending',
    });

    if (error) {
      console.error('[webhook] Supabase insert error:', error.message);
      return res.status(500).json({ error: 'DB error' });
    }
  }

  res.status(200).json({ received: true });
};
