import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: CORS });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: CORS });

    // Only allow for the superadmin email
    const SUPERADMIN = 'vijithanaik29@gmail.com';
    if (user.email !== SUPERADMIN) return new Response(JSON.stringify({ ok: false }), { status: 403, headers: CORS });

    const { pin } = await req.json();
    const correctPin = Deno.env.get('ADMIN_PIN');
    if (!correctPin) return new Response(JSON.stringify({ ok: false, error: 'PIN not configured' }), { headers: CORS });

    const ok = pin === correctPin;
    return new Response(JSON.stringify({ ok }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: CORS });
  }
});
