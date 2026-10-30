import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { email, name, org_name } = await req.json();

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!RESEND_API_KEY) {
    // Email service not configured yet — rejection was saved to DB, just skip email
    console.warn('RESEND_API_KEY not set — skipping rejection email to', email);
    return new Response(JSON.stringify({ success: true, skipped: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const firstName = name.split(' ')[0];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <div style="height:5px;background:linear-gradient(90deg,#E40303,#FF8C00,#FFED00,#008026,#004DFF,#750787);"></div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:28px 16px 40px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0">

        <tr><td style="padding-bottom:20px;text-align:center;">
          <span style="font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#ffffff;opacity:.5;">Q2Q · QUEER EVENTS INDIA</span>
        </td></tr>

        <tr><td style="background:#1a1a1a;border-radius:20px;padding:36px 32px;">

          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-flex;width:56px;height:56px;background:#1f1f1f;border:2px solid #2a2a2a;border-radius:50%;align-items:center;justify-content:center;">
              <span style="font-size:26px;line-height:1;">🙏</span>
            </div>
          </div>

          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#fff;text-align:center;">Application Update</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#6b7280;text-align:center;">For ${org_name}</p>

          <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
            Hi ${firstName},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.6;">
            Thank you for applying to list events on Q2Q. We reviewed your application for <strong style="color:#fff;">${org_name}</strong> carefully.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#d1d5db;line-height:1.6;">
            At this time, we're not able to move forward with your application. This may be because your application didn't fully meet our <a href="https://q2q.co.in/terms" style="color:#818cf8;">organiser guidelines</a>, or because we're not yet operating in your area. This is not a reflection of the quality of your work.
          </p>

          <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:18px 20px;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">What this means</p>
            <ul style="margin:0;padding:0 0 0 18px;color:#9ca3af;font-size:13px;line-height:1.8;">
              <li>You can reapply after 90 days</li>
              <li>Make sure your event listing meets our <a href="https://q2q.co.in/terms" style="color:#818cf8;">community guidelines</a></li>
              <li>Reply to this email if you believe this was an error</li>
            </ul>
          </div>

          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
            We're growing — if we expand to your city or your event type, we'll be in touch.
          </p>

          <p style="margin:0;font-size:14px;color:#9ca3af;">
            With love,<br/><strong style="color:#fff;">The Q2Q Team</strong>
          </p>
        </td></tr>

        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#4b5563;">
            Questions? <a href="mailto:hello@q2q.co.in" style="color:#818cf8;">hello@q2q.co.in</a>
          </p>
          <p style="margin:0;font-size:11px;color:#374151;">Q2Q · Queer Events India · q2q.co.in</p>
        </td></tr>

      </table>
    </td></tr>
  </table>

  <div style="height:5px;background:linear-gradient(90deg,#750787,#004DFF,#008026,#FFED00,#FF8C00,#E40303);"></div>

</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Q2Q <hello@q2q.co.in>',
      to: [email],
      subject: 'Your Q2Q organizer application',
      html,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error('Resend error:', result);
    return new Response(JSON.stringify({ error: result.message ?? 'Email send failed' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
