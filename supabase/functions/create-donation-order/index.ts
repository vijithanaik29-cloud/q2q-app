import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CF_APP_ID = Deno.env.get('CASHFREE_APP_ID')!;
const CF_SECRET = Deno.env.get('CASHFREE_SECRET_KEY')!;
const CF_ENV    = Deno.env.get('CASHFREE_ENV') ?? 'production';
const CF_BASE   = CF_ENV === 'sandbox'
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { amount, fundraiserId, fundraiserTitle, cfOrderId, donorName, donorEmail } = await req.json();

  if (!amount || amount < 1) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(`${CF_BASE}/orders`, {
    method: 'POST',
    headers: {
      'x-api-version':   '2023-08-01',
      'x-client-id':     CF_APP_ID,
      'x-client-secret': CF_SECRET,
      'Content-Type':    'application/json',
    },
    body: JSON.stringify({
      order_id:       cfOrderId,
      order_amount:   amount,
      order_currency: 'INR',
      order_note:     fundraiserTitle,
      customer_details: {
        customer_id:    (donorEmail || cfOrderId).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50),
        customer_name:  donorName || 'Anonymous',
        customer_email: donorEmail || 'noreply@q2q.co.in',
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `https://q2q.co.in/fundraisers/${fundraiserId}?cf_donation_order_id={order_id}`,
      },
    }),
  });

  const order = await res.json();

  if (!res.ok) {
    console.error('Cashfree error:', JSON.stringify(order));
    return new Response(
      JSON.stringify({ error: order.message ?? 'Order creation failed' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ cfOrderId: order.order_id, paymentSessionId: order.payment_session_id, env: CF_ENV }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  );
});
