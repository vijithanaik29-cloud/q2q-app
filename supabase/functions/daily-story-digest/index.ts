import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

serve(async () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response('missing env', { status: 500 });
  }

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping digest email');
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  // Query pending stories
  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/stories?status=eq.pending&select=id,title,body,tags,created_at&order=created_at.asc`,
    {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!dbRes.ok) {
    const err = await dbRes.text();
    console.error('DB query failed:', err);
    return new Response('db error', { status: 500 });
  }

  const stories: Array<{
    id: string;
    title: string | null;
    body: string;
    tags: string[] | null;
    created_at: string;
  }> = await dbRes.json();

  if (stories.length === 0) {
    console.log('No pending stories — skipping email');
    return new Response(JSON.stringify({ count: 0, sent: false }), { status: 200 });
  }

  const count = stories.length;
  const preview = stories.slice(0, 5);

  const storyRows = preview.map((s, i) => {
    const submittedAt = new Date(s.created_at).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    const tags = (s.tags || []).slice(0, 3).map(t => `<span style="display:inline-block;background:#f3e8ff;color:#7e22ce;border-radius:4px;padding:1px 7px;font-size:11px;margin:0 2px;">${esc(t)}</span>`).join('');
    const bodySnippet = esc((s.body || '').slice(0, 100)) + ((s.body || '').length > 100 ? '…' : '');
    return `
      <tr style="border-top:1px solid #f0f0f0;">
        <td style="padding:12px 0;vertical-align:top;">
          <div style="font-weight:600;font-size:13px;color:#1a1a1a;margin-bottom:4px;">${esc(s.title || 'Untitled story')} <span style="color:#999;font-weight:400;">#${i + 1}</span></div>
          <div style="font-size:12px;color:#555;line-height:1.5;margin-bottom:6px;">${bodySnippet}</div>
          <div>${tags}</div>
          <div style="font-size:11px;color:#aaa;margin-top:4px;">${submittedAt}</div>
        </td>
      </tr>`;
  }).join('');

  const moreNote = count > 5
    ? `<p style="color:#888;font-size:12px;text-align:center;margin:16px 0 0;">+${count - 5} more pending in the admin panel</p>`
    : '';

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
      <div style="margin-bottom:20px;">
        <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(90deg,#ff4b6e,#9b5de5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Q2Q</span>
        <span style="font-size:12px;color:#aaa;margin-left:8px;letter-spacing:0.05em;text-transform:uppercase;">Daily Digest</span>
      </div>

      <h2 style="font-size:20px;font-weight:700;margin:0 0 6px;">
        ${count} stor${count === 1 ? 'y' : 'ies'} waiting for review
      </h2>
      <p style="color:#666;font-size:13px;margin:0 0 24px;">
        ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <table style="width:100%;border-collapse:collapse;">
        ${storyRows}
      </table>
      ${moreNote}

      <div style="margin-top:28px;text-align:center;">
        <a href="https://www.q2q.co.in/superadmin"
           style="display:inline-block;background:linear-gradient(135deg,#ff4b6e,#9b5de5);color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px;letter-spacing:0.02em;">
          Review stories →
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px"/>
      <p style="font-size:11px;color:#ccc;margin:0;text-align:center;">
        Q2Q · <a href="https://www.q2q.co.in" style="color:#ccc;">q2q.co.in</a>
      </p>
    </div>`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Q2Q <hello@q2q.co.in>',
      to: ['vijithanaik29@gmail.com'],
      subject: `${count} pending stor${count === 1 ? 'y' : 'ies'} on Q2Q — review needed`,
      html,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.json();
    console.error('Resend error:', err);
    return new Response('email error', { status: 500 });
  }

  console.log(`Digest sent: ${count} pending stories`);
  return new Response(JSON.stringify({ count, sent: true }), { status: 200 });
});
