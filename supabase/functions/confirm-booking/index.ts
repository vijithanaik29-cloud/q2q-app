import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_KEY_SECRET   = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY        = Deno.env.get('RESEND_API_KEY');

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
  const raw = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
  const hex = Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === sig;
}

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function buildEmailHtml(b: {
  id: string; eventTitle: string; eventDate: string;
  eventVenue: string; eventCity: string; attendee: { name: string; email: string };
  tickets: { type: string; qty: number; price: number }[]; total: number; gradient: string;
}) {
  const gradient = b.gradient || 'linear-gradient(135deg,#667eea,#764ba2)';
  const isFree   = b.total === 0;

  const ticketChips = b.tickets
    .filter(t => t.qty > 0)
    .map(t => `<span style="display:inline-block;margin:3px 4px 3px 0;padding:4px 12px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:100px;font-size:12px;font-weight:700;color:#fff;letter-spacing:.02em;">
      ${t.qty}× ${t.type}${t.price > 0 ? ` · ₹${(t.price * t.qty).toLocaleString('en-IN')}` : ' · Free'}
    </span>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <!-- Rainbow stripe -->
  <div style="height:5px;background:linear-gradient(90deg,#E40303,#FF8C00,#FFED00,#008026,#004DFF,#750787);"></div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:28px 16px 40px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0">

        <!-- Brand -->
        <tr><td style="padding-bottom:20px;text-align:center;">
          <span style="font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#ffffff;opacity:.5;">Q2Q · QUEER EVENTS INDIA</span>
        </td></tr>

        <!-- Hero ticket card -->
        <tr><td style="background:${gradient};border-radius:20px 20px 0 0;padding:36px 32px 28px;position:relative;">
          <!-- Celebration badge -->
          <div style="display:inline-block;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:100px;padding:5px 14px;margin-bottom:18px;">
            <span style="font-size:12px;font-weight:700;color:#fff;letter-spacing:.06em;text-transform:uppercase;">🎉 You're going!</span>
          </div>

          <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;color:#fff;line-height:1.15;letter-spacing:-.5px;">${b.eventTitle}</h1>

          <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,.8);line-height:1.5;">
            📅 &nbsp;${formatDate(b.eventDate)}<br>
            📍 &nbsp;${b.eventVenue}, ${b.eventCity}
          </p>

          <!-- Ticket chips -->
          <div style="margin-bottom:4px;">${ticketChips}</div>
        </td></tr>

        <!-- Tear line -->
        <tr><td style="background:#1a1a1a;padding:0 0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:20px;background:#0f0f0f;border-radius:0 10px 10px 0;"></td>
            <td style="border-top:2px dashed #333;"></td>
            <td style="width:20px;background:#0f0f0f;border-radius:10px 0 0 10px;"></td>
          </tr></table>
        </td></tr>

        <!-- Booking stub -->
        <tr><td style="background:#1a1a1a;border-radius:0 0 20px 20px;padding:28px 32px 32px;">

          <!-- Confirmed banner -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
            <div style="width:32px;height:32px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span style="color:#fff;font-size:16px;font-weight:900;line-height:1;">✓</span>
            </div>
            <div>
              <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">Booking confirmed</p>
              <p style="margin:0;font-size:12px;color:#6b7280;">Hi ${b.attendee.name} — your spot is locked in 🌈</p>
            </div>
          </div>

          <!-- Booking ID -->
          <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">Booking ID</p>
            <p style="margin:0;font-size:22px;font-weight:900;font-family:'Courier New',monospace;letter-spacing:.08em;color:#fff;">${b.id}</p>
          </div>

          <!-- Payment row -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #2a2a2a;padding-top:16px;margin-bottom:28px;">
            <span style="font-size:13px;color:#9ca3af;">Amount paid</span>
            <span style="font-size:20px;font-weight:900;color:${isFree ? '#10b981' : '#fff'};">
              ${isFree ? 'Free ✓' : `₹${b.total.toLocaleString('en-IN')}`}
            </span>
          </div>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="https://q2q.co.in/my-bookings"
               style="display:inline-block;background:linear-gradient(90deg,#E40303,#FF8C00,#FFED00,#008026,#004DFF,#750787);color:#fff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:.02em;">
              View My Ticket →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#4b5563;">
            Questions? <a href="mailto:hello@q2q.co.in" style="color:#818cf8;">hello@q2q.co.in</a>
          </p>
          <p style="margin:0;font-size:11px;color:#374151;">Q2Q · Queer Events India · q2q.co.in</p>
        </td></tr>

      </table>
    </td></tr>
  </table>

  <!-- Rainbow stripe bottom -->
  <div style="height:5px;background:linear-gradient(90deg,#750787,#004DFF,#008026,#FFED00,#FF8C00,#E40303);"></div>

</body>
</html>`;
}

async function resendSend(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Q2Q <hello@q2q.co.in>', to: [to], subject, html }),
  });
  if (!res.ok) console.error('Resend error:', await res.json());
}

async function sendConfirmationEmail(booking: {
  id: string; eventTitle: string; eventDate: string;
  eventVenue: string; eventCity: string; attendee: { name: string; email: string };
  tickets: { type: string; qty: number; price: number }[]; total: number; gradient: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping confirmation email');
    return;
  }
  await resendSend(
    booking.attendee.email,
    `You're going to ${booking.eventTitle}! 🎉`,
    buildEmailHtml(booking),
  );
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

  function genBookingId(category: string, organizer: string): string {
    const cat  = (category  || 'EVT').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
    const org  = (organizer || '').split(/\s+/).filter(Boolean).map((w: string) => w[0]).join('')
                   .replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'ORG';
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `Q2Q-${cat}${org}-${rand}`;
  }

  const id = genBookingId(booking.eventCategory, booking.organizer);

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

  if (booking.couponId) {
    await supabase.rpc('increment_coupon_uses', { p_coupon_id: booking.couponId });
  }

  const bookingData = {
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
  };

  // Non-blocking — don't fail the booking if email fails
  sendConfirmationEmail(bookingData).catch(err => console.error('Email error:', err));

  return new Response(JSON.stringify({ booking: bookingData }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
