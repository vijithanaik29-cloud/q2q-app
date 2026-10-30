import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendApprovalEmail(email: string, name: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return;

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

        <!-- Hero -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed,#db2777);border-radius:20px 20px 0 0;padding:40px 32px 32px;text-align:center;">
          <div style="font-size:52px;line-height:1;margin-bottom:16px;">🎊</div>
          <div style="display:inline-block;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);border-radius:100px;padding:5px 16px;margin-bottom:16px;">
            <span style="font-size:12px;font-weight:700;color:#fff;letter-spacing:.08em;text-transform:uppercase;">✓ &nbsp;Approved!</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;line-height:1.2;">You're in, ${firstName}!</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,.8);">Welcome to the Q2Q organiser family 🏳️‍🌈</p>
        </td></tr>

        <!-- Tear line -->
        <tr><td style="background:#1a1a1a;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:20px;background:#0f0f0f;border-radius:0 10px 10px 0;"></td>
            <td style="border-top:2px dashed #333;"></td>
            <td style="width:20px;background:#0f0f0f;border-radius:10px 0 0 10px;"></td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#1a1a1a;border-radius:0 0 20px 20px;padding:32px 32px;">

          <p style="margin:0 0 20px;font-size:15px;color:#d1d5db;line-height:1.6;">
            Your application has been approved — you can now list events on Q2Q and reach thousands of queer people across India.
          </p>

          <!-- Steps -->
          <div style="margin-bottom:28px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">Getting started</p>

            <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
              <div style="min-width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="color:#fff;font-size:13px;font-weight:800;">1</span>
              </div>
              <div style="padding-top:4px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#fff;">Check your inbox</p>
                <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">A separate email from Supabase will arrive with your secure login link.</p>
              </div>
            </div>

            <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
              <div style="min-width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="color:#fff;font-size:13px;font-weight:800;">2</span>
              </div>
              <div style="padding-top:4px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#fff;">Set up your account</p>
                <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Click the link to set your password and access your organiser dashboard.</p>
              </div>
            </div>

            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div style="min-width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="color:#fff;font-size:13px;font-weight:800;">3</span>
              </div>
              <div style="padding-top:4px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#fff;">List your first event</p>
                <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Go live — Q2Q takes 10% on paid tickets only. Free events always ₹0.</p>
              </div>
            </div>
          </div>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="https://q2q.co.in/admin"
               style="display:inline-block;background:linear-gradient(90deg,#E40303,#FF8C00,#FFED00,#008026,#004DFF,#750787);color:#fff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:.02em;">
              Go to My Dashboard →
            </a>
          </div>

          <p style="margin:0;font-size:14px;color:#9ca3af;">
            Excited to have you with us,<br/><strong style="color:#fff;">The Q2Q Team</strong>
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

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Q2Q <hello@q2q.co.in>',
      to:      [email],
      subject: `🎊 You're approved, ${firstName}! Welcome to Q2Q`,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, app_id } = await req.json();

    if (!email || !name || !app_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Send our celebratory approval email first (non-blocking)
    sendApprovalEmail(email, name).catch(err => console.error('Approval email error:', err));

    // Send Supabase invite — magic link for account setup
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name, role: 'organizer' },
      redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://q2q-app.vercel.app'}/admin`,
    });

    if (error) throw error;

    // Mark application approved
    await supabaseAdmin
      .from('organizer_applications')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', app_id);

    return new Response(JSON.stringify({ success: true, user_id: data.user?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
