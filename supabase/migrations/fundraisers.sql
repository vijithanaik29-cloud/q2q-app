-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qrjtswrvjygokeuabzvv/sql

create table if not exists fundraisers (
  id            uuid        default gen_random_uuid() primary key,
  title         text        not null,
  cause         text        not null,
  organizer_id  uuid        references auth.users(id) on delete set null,
  organizer_name text       not null,
  target_amount integer     not null check (target_amount > 0),
  collected_amount integer  not null default 0,
  donor_count   integer     not null default 0,
  status        text        not null default 'active' check (status in ('active', 'closed', 'draft')),
  end_date      date,
  created_at    timestamptz default now()
);

create table if not exists donations (
  id                 text        primary key,
  fundraiser_id      uuid        references fundraisers(id) on delete cascade,
  fundraiser_title   text        not null,
  amount             integer     not null check (amount > 0),
  donor_name         text        not null,
  donor_email        text        not null,
  message            text,
  anonymous          boolean     not null default false,
  payment_id         text,
  razorpay_order_id  text,
  created_at         timestamptz default now()
);

alter table fundraisers enable row level security;
alter table donations    enable row level security;

-- Anyone can read active fundraisers
create policy "public read fundraisers" on fundraisers
  for select using (status = 'active');

-- Organizers can manage their own
create policy "organizers manage fundraisers" on fundraisers
  for all using (auth.uid() = organizer_id);

-- Atomic increment when a donation is confirmed (called from edge function with service role)
create or replace function increment_fundraiser_totals(p_fundraiser_id uuid, p_amount integer)
returns void language plpgsql security definer as $$
begin
  update fundraisers
  set collected_amount = collected_amount + p_amount,
      donor_count      = donor_count + 1
  where id = p_fundraiser_id;
end;
$$;
