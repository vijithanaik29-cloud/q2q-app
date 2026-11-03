import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CF_APP_ID  = Deno.env.get('CASHFREE_APP_ID')!;
const CF_SECRET  = Deno.env.get('CASHFREE_SECRET_KEY')!;
const CF_ENV     = Deno.env.get('CASHFREE_ENV') ?? 'production';
const CF_BASE    = CF_ENV === 'sandbox'
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg';
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPERADMIN_EMAIL = 'vijithanaik29@gmail.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function cashfreeRefund(cfOrderId: string, amount: number, bookingId: string) {
  const refundId = `ref_${bookingId.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}`;
  const res = await fetch(`${CF_BASE}/orders/${cfOrderId}/refunds`, {
    method: 'POST',
    headers: {
      'x-api-version':   '2023-08-01',
      'x-client-id':     CF_APP_ID,
      'x-client-secret': CF_SECRET,
      'Content-Type':    'application/json',
    },
    body: JSON.stringify({
      refund_amount: amount,
      refund_id:     refundId,
      refund_note:   'Event cancelled by organiser',
    }),
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
    .select('id, cf_order_id, total')
    .eq('event_id', event_id)
    .eq('status', 'active')
    .not('cf_order_id', 'is', null);

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
    const refund = await cashfreeRefund(booking.cf_order_id, booking.total, booking.id);

    // Cashfree returns refund_status: SUCCESS, PENDING, or an error
    if (refund.cf_refund_id || refund.refund_status === 'SUCCESS' || refund.refund_status === 'PENDING') {
      await supabase.from('bookings').update({ status: 'refunded' }).eq('id', booking.id);
      results.push({ booking_id: booking.id, refund_id: refund.cf_refund_id, status: refund.refund_status ?? 'PENDING' });
    } else {
      results.push({ booking_id: booking.id, error: refund.message ?? 'Refund failed' });
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
