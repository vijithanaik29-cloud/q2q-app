import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown) =>
  new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { email } = await req.json();
  if (!email?.trim()) return json({ isInfluencer: false });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  const { data } = await supabase
    .from('influencers')
    .select('name, expires_at')
    .eq('email', email.trim().toLowerCase())
    .eq('active', true)
    .single();

  if (!data) return json({ isInfluencer: false });
  if (new Date(data.expires_at) < new Date()) return json({ isInfluencer: false });

  return json({ isInfluencer: true, name: data.name });
});
