import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY      = Deno.env.get('RESEND_API_KEY');

async function verifySignature(orderId: string, paymentId: string, sig: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(RAZORPAY_KEY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const raw = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
  const hex = Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === sig;
}

function genDonationId() {
  return `DON-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

async function sendReceiptEmail(donor: { name: string; email: string }, amount: number, fundraiserTitle: string, donationId: string) {
  if (!RESEND_API_KEY) return;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="height:5px;background:linear-gradient(90deg,#E40303,#FF8C00,#FFED00,#008026,#004DFF,#750787);"></div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:28px 16px 40px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:20px;text-align:center;">
          <span style="font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5);">Q2Q · QUEER EVENTS INDIA</span>
        </td></tr>
        <tr><td style="background:linear-gradient(135deg,#10b981,#059669);border-radius:20px 20px 0 0;padding:36px 32px 28px;text-align:center;">
          <div style="font-size:48px;line-height:1;margin-bottom:16px;">💚</div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#fff;">Thank you, ${donor.name.split(' ')[0]}!</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,.85);">Your donation makes a difference.</p>
        </td></tr>
        <tr><td style="background:#1a1a1a;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:20px;background:#0f0f0f;border-radius:0 10px 10px 0;"></td>
            <td style="border-top:2px dashed #333;"></td>
            <td style="width:20px;background:#0f0f0f;border-radius:10px 0 0 10px;"></td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#1a1a1a;border-radius:0 0 20px 20px;padding:28px 32px 32px;">
          <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">Donated to</p>
            <p style="margin:0 0 16px;font-size:17px;font-weight:800;color:#fff;">${fundraiserTitle}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #2a2a2a;padding-top:14px;">
              <span style="font-size:13px;color:#9ca3af;">Amount donated</span>
              <span style="font-size:22px;font-weight:900;color:#10b981;">₹${amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">Donation ID</p>
            <p style="margin:0;font-size:18px;font-weight:900;font-family:'Courier New',monospace;letter-spacing:.08em;color:#fff;">${donationId}</p>
          </div>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="https://q2q.co.in/fundraisers" style="display:inline-block;background:linear-gradient(90deg,#E40303,#FF8C00,#FFED00,#008026,#004DFF,#750787);color:#fff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 36px;border-radius:100px;">
              See All Campaigns →
            </a>
          </div>
          <p style="margin:0;font-size:14px;color:#9ca3af;">With gratitude,<br/><strong style="color:#fff;">The Q2Q Team</strong></p>
        </td></tr>
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#4b5563;">Questions? <a href="mailto:hello@q2q.co.in" style="color:#818cf8;">hello@q2q.co.in</a></p>
          <p style="margin:0;font-size:11px;color:#374151;">Q2Q · Queer Events India · q2q.co.in</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  <div style="height:5px;background:linear-gradient(90deg,#750787,#004DFF,#008026,#FFED00,#FF8C00,#E40303);"></div>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Q2Q <hello@q2q.co.in>',
      to:      [donor.email],
      subject: `💚 Thank you for donating ₹${amount.toLocaleString('en-IN')} to ${fundraiserTitle}`,
      html,
    }),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { payment, donation } = await req.json();
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payment;

  const valid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const id = genDonationId();

  const { error } = await supabase.from('donations').insert({
    id,
    fundraiser_id:    donation.fundraiserId,
    fundraiser_title: donation.fundraiserTitle,
    amount:           donation.amount,
    donor_name:       donation.donor.name,
    donor_email:      donation.donor.email,
    message:          donation.message || null,
    anonymous:        donation.anonymous || false,
    payment_id:       razorpay_payment_id,
    razorpay_order_id,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  await supabase.rpc('increment_fundraiser_totals', {
    p_fundraiser_id: donation.fundraiserId,
    p_amount:        donation.amount,
  });

  sendReceiptEmail(donation.donor, donation.amount, donation.fundraiserTitle, id)
    .catch(err => console.error('Receipt email error:', err));

  return new Response(JSON.stringify({ success: true, donationId: id }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
