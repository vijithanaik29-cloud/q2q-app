import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!;
  const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

  const { amount, fundraiserId, fundraiserTitle } = await req.json();

  if (!amount || amount < 1) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount:   amount * 100, // paise
      currency: 'INR',
      receipt:  `don_${fundraiserId}_${Date.now()}`,
      notes:    { fundraiser_id: fundraiserId, fundraiser_title: fundraiserTitle },
    }),
  });

  const order = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: order.error?.description ?? 'Order creation failed' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ orderId: order.id, amount, keyId: RAZORPAY_KEY_ID }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
