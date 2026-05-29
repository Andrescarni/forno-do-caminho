// GET /api/order-status?session=xxx
// Returns order details for the confirmation page.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { session } = req.query;
  if (!session) return res.status(400).json({ error: 'Missing session' });

  const { data, error } = await supabase
    .from('orders')
    .select('customer_name, items, total, note, status, created_at')
    .eq('stripe_session_id', session)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Order not found' });

  res.status(200).json(data);
};
