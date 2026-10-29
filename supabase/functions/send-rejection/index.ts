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

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
      <div style="margin-bottom:28px">
        <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px">Q2Q</span>
        <span style="font-size:13px;color:#888;margin-left:8px">Queer Events India</span>
      </div>

      <h2 style="font-size:20px;font-weight:700;margin:0 0 12px">Application Update</h2>
      <p style="color:#444;line-height:1.6;margin:0 0 16px">
        Hi ${name}, thank you for applying to host events on Q2Q.
      </p>
      <p style="color:#444;line-height:1.6;margin:0 0 24px">
        After reviewing your application for <strong>${org_name}</strong>, we're unable to approve it at this time.
        We receive many applications and can only work with a limited number of organizers in each city right now.
      </p>
      <p style="color:#444;line-height:1.6;margin:0 0 24px">
        This doesn't reflect on the quality of your work — we encourage you to apply again in the future as we expand.
        If you have questions, reply to this email and we'll get back to you.
      </p>
      <p style="color:#444;line-height:1.6;margin:0">
        With love,<br/>
        <strong>The Q2Q Team</strong>
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
      <p style="font-size:12px;color:#aaa;margin:0">
        Q2Q — Connecting queer communities across India, one event at a time.
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Q2Q <onboarding@resend.dev>',
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
