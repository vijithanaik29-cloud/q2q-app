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

  const { code, eventId, total } = await req.json();

  if (!code?.trim()) return json({ valid: false, error: 'Enter a promo code' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .single();

  if (!coupon)
    return json({ valid: false, error: 'Invalid code' });

  if (coupon.uses_count >= coupon.max_uses)
    return json({ valid: false, error: 'This code has reached its limit' });

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return json({ valid: false, error: 'This code has expired' });

  if (coupon.event_id && coupon.event_id !== eventId)
    return json({ valid: false, error: 'This code is not valid for this event' });

  const discount = coupon.discount_type === 'percent'
    ? Math.round(total * coupon.discount_value / 100)
    : Math.min(coupon.discount_value, total);

  return json({
    valid: true,
    couponId: coupon.id,
    discount,
    label: coupon.discount_type === 'percent'
      ? `${coupon.discount_value}% off`
      : `₹${coupon.discount_value} off`,
  });
});
