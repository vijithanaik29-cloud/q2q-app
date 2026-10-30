import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPERADMIN = 'vijithanaik29@gmail.com';

function base32Decode(input: string): Uint8Array {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const s = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const out = new Uint8Array(Math.floor(s.length * 5 / 8));
  let bits = 0, val = 0, idx = 0;
  for (const c of s) {
    const i = alpha.indexOf(c);
    if (i < 0) continue;
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out[idx++] = (val >>> (bits - 8)) & 0xff; bits -= 8; }
  }
  return out;
}

async function computeTOTP(secretB32: string, counter: bigint): Promise<string> {
  const secret = base32Decode(secretB32);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, counter, false);
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
  const off  = sig[sig.length - 1] & 0x0f;
  const code = (((sig[off] & 0x7f) << 24) | ((sig[off+1] & 0xff) << 16) | ((sig[off+2] & 0xff) << 8) | (sig[off+3] & 0xff)) % 1_000_000;
  return code.toString().padStart(6, '0');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: CORS });

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user || user.email !== SUPERADMIN) {
      return new Response(JSON.stringify({ ok: false }), { status: 403, headers: CORS });
    }

    const { token } = await req.json().catch(() => ({}));
    if (!token || !/^\d{6}$/.test(String(token))) {
      return new Response(JSON.stringify({ ok: false, error: 'Enter a 6-digit code' }), { headers: CORS });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data } = await supabaseAdmin
      .from('admin_config')
      .select('value')
      .eq('key', 'totp_secret')
      .single();

    if (!data) {
      return new Response(JSON.stringify({ ok: false, error: 'TOTP not set up' }), { headers: CORS });
    }

    // Accept current step ±1 (covers 30s clock drift)
    const step = BigInt(Math.floor(Date.now() / 1000 / 30));
    for (const d of [0n, -1n, 1n]) {
      const expected = await computeTOTP(data.value, step + d);
      if (expected === String(token)) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: CORS });
  }
});
