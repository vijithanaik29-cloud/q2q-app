import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPERADMIN = 'vijithanaik29@gmail.com';

function generateBase32Secret(): string {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let result = '', buf = 0, bits = 0;
  for (const byte of bytes) {
    buf = (buf << 8) | byte; bits += 8;
    while (bits >= 5) { bits -= 5; result += alpha[(buf >> bits) & 31]; }
  }
  if (bits > 0) result += alpha[(buf << (5 - bits)) & 31];
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user || user.email !== SUPERADMIN) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({}));

    if (body.action === 'status') {
      const { data } = await supabaseAdmin
        .from('admin_config')
        .select('key')
        .eq('key', 'totp_secret')
        .maybeSingle();
      return new Response(JSON.stringify({ configured: !!data }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Generate and store new secret
    const secret = generateBase32Secret();
    const label  = encodeURIComponent('Q2Q Superadmin');
    const issuer = encodeURIComponent('Q2Q');
    const uri    = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    await supabaseAdmin.from('admin_config').upsert({
      key: 'totp_secret', value: secret, updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ uri, secret }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
