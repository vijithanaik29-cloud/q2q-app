import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPERADMIN_EMAIL    = 'vijithanaik29@gmail.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function razorpayRefund(paymentId: string, amountPaise: number) {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountPaise }),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Verify caller is the superadmin
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase   = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const { data: { user } } = await createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!)
    .auth.getUser(authHeader.replace('Bearer ', ''));

  if (!user || user.email !== SUPERADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 403, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { event_id } = await req.json();
  if (!event_id) {
    return new Response(JSON.stringify({ error: 'event_id required' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Fetch all active paid bookings for this event
  const { data: bookings, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, payment_id, total')
    .eq('event_id', event_id)
    .eq('status', 'active')
    .not('payment_id', 'is', null);

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!bookings || bookings.length === 0) {
    return new Response(JSON.stringify({ refunded: 0, total_amount: 0 }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const results = [];
  for (const booking of bookings) {
    const amountPaise = Math.round(booking.total * 100);
    const refund = await razorpayRefund(booking.payment_id, amountPaise);

    if (refund.id) {
      // Mark booking as refunded
      await supabase.from('bookings')
        .update({ status: 'refunded' })
        .eq('id', booking.id);
      results.push({ booking_id: booking.id, refund_id: refund.id, status: 'refunded' });
    } else {
      results.push({ booking_id: booking.id, error: refund.error?.description ?? 'Refund failed' });
    }
  }

  const refundedCount = results.filter(r => r.refund_id).length;
  const totalAmount   = bookings
    .filter((_, i) => results[i]?.refund_id)
    .reduce((sum, b) => sum + b.total, 0);

  return new Response(JSON.stringify({ refunded: refundedCount, total_amount: totalAmount, results }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
