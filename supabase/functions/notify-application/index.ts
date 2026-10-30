import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping application emails');
    return new Response(JSON.stringify({ success: true, skipped: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { name, org_name, email, city, event_types, instagram } = await req.json();

  async function send(to: string, subject: string, html: string) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Q2Q <hello@q2q.co.in>', to: [to], subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.json());
  }

  // 1. Notify admin
  await send(
    'hello@q2q.co.in',
    `New organiser application — ${org_name} (${city})`,
    `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
      <h2 style="margin:0 0 4px;">New organiser application 🎉</h2>
      <p style="color:#888;margin:0 0 24px;font-size:13px;">Submitted just now</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Organisation</td><td style="padding:8px 0;font-weight:600;">${org_name}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#888;">City</td><td style="padding:8px 0;">${city}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Event types</td><td style="padding:8px 0;">${(event_types || []).join(', ')}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Instagram</td><td style="padding:8px 0;"><a href="${instagram}">${instagram}</a></td></tr>
      </table>
      <div style="margin-top:24px;">
        <a href="https://q2q.co.in/admin" style="display:inline-block;background:#1a1a1a;color:#fff;font-weight:700;font-size:13px;text-decoration:none;padding:10px 20px;border-radius:8px;">
          Review in Admin Panel →
        </a>
      </div>
    </div>`
  );

  // 2. Acknowledge to applicant
  await send(
    email,
    `We received your Q2Q application, ${name.split(' ')[0]}!`,
    `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
      <div style="margin-bottom:24px;">
        <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">Q2Q</span>
        <span style="font-size:13px;color:#888;margin-left:8px;">Queer Events India</span>
      </div>
      <h2 style="font-size:20px;font-weight:700;margin:0 0 12px;">Application received! 🌈</h2>
      <p style="color:#444;line-height:1.6;margin:0 0 16px;">
        Hi ${name.split(' ')[0]}, thanks for applying to list <strong>${org_name}</strong> on Q2Q.
      </p>
      <p style="color:#444;line-height:1.6;margin:0 0 24px;">
        We review every organiser application personally to keep Q2Q a safe, genuine space for India's queer community.
        We'll get back to you within <strong>2–3 business days</strong>.
      </p>
      <p style="color:#444;line-height:1.6;margin:0 0 24px;">
        In the meantime, feel free to reply to this email if you have any questions.
      </p>
      <p style="color:#444;line-height:1.6;margin:0;">
        With love,<br/><strong>The Q2Q Team</strong>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
      <p style="font-size:12px;color:#aaa;margin:0;">
        Q2Q — Queer Events India · <a href="https://q2q.co.in" style="color:#6366f1;">q2q.co.in</a>
      </p>
    </div>`
  );

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
