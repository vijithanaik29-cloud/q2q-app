import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_KEY_SECRET     = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUPABASE_URL            = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyRazorpaySignature(orderId: string, paymentId: string, sig: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(RAZORPAY_KEY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const raw  = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
  const hex  = Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === sig;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { payment, booking } = await req.json();
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payment;

  const valid = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  const id = `Q2Q-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase.from('bookings').insert({
    id,
    event_id:           booking.eventId,
    event_title:        booking.eventTitle,
    event_date:         booking.eventDate,
    event_venue:        booking.eventVenue,
    event_city:         booking.eventCity,
    gradient:           booking.gradient,
    total:              booking.total,
    tickets:            booking.tickets,
    attendee:           booking.attendee,
    payment_id:         razorpay_payment_id,
    razorpay_order_id:  razorpay_order_id,
    status:             'active',
    payout_released:    false,
  }).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    booking: {
      id:         data.id,
      eventId:    data.event_id,
      eventTitle: data.event_title,
      eventDate:  data.event_date,
      eventVenue: data.event_venue,
      eventCity:  data.event_city,
      gradient:   data.gradient,
      total:      data.total,
      tickets:    data.tickets,
      attendee:   data.attendee,
      createdAt:  data.created_at,
    },
  }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
