-- Coupon codes for marketing & influencer partnerships

create table if not exists coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  discount_type   text not null check (discount_type in ('percent', 'flat')),
  discount_value  integer not null check (discount_value > 0),
  max_uses        integer not null default 100,
  uses_count      integer not null default 0,
  expires_at      timestamptz,
  event_id        text,         -- null = applies to all events
  active          boolean not null default true,
  created_at      timestamptz default now()
);

-- Service role only — validation goes through edge function
alter table coupons enable row level security;

-- Helper: safely increment uses_count
create or replace function increment_coupon_uses(p_coupon_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update coupons set uses_count = uses_count + 1 where id = p_coupon_id;
end;
$$;
