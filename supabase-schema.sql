-- ─── Run this in the Supabase SQL editor ────────────────────────────────────
-- Project: Q2Q — Queer Events India

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.events (
  id               text         primary key,
  title            text         not null,
  city             text         not null,
  venue            text         not null,
  address          text         default '',
  date             text         not null,
  time             text         not null,
  end_time         text         default '',
  category         text         not null,
  description      text         not null,
  long_description text         default '',
  gradient         text         not null,
  accent_color     text         default '',
  organizer        text         not null,
  organizer_contact text        default '',
  organizer_id     uuid         references auth.users not null,
  featured         boolean      default false,
  tags             text[]       default '{}',
  attendees        integer      default 0,
  tickets          jsonb        not null default '[]',
  created_at       timestamptz  default now()
);

create table if not exists public.bookings (
  id          text        primary key,
  event_id    text        not null,
  event_title text,
  event_date  text,
  event_venue text,
  event_city  text,
  gradient    text,
  total       integer     default 0,
  tickets     jsonb       not null default '[]',
  attendee    jsonb       not null,
  payment_id  text,       -- Razorpay payment_id for paid bookings
  created_at  timestamptz default now()
);

create table if not exists public.checkins (
  booking_id    text        primary key references public.bookings(id),
  checked_in_at timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.events   enable row level security;
alter table public.bookings enable row level security;
alter table public.checkins enable row level security;

-- Events: public read; insert/update/delete only by the owner organizer
create policy "events_public_read"    on public.events for select using (true);
create policy "events_owner_insert"   on public.events for insert with check (auth.uid() = organizer_id);
create policy "events_owner_update"   on public.events for update using (auth.uid() = organizer_id);
create policy "events_owner_delete"   on public.events for delete using (auth.uid() = organizer_id);

-- Bookings: anyone can insert (anonymous booking + edge function service-role insert);
-- authenticated organizers can read bookings for their events (or for seed events not in the events table)
create policy "bookings_anon_insert"  on public.bookings for insert with check (true);
create policy "bookings_org_read"     on public.bookings for select using (
  auth.uid() is not null
  and (
    -- seed events (not stored in events table) visible to all organizers
    not exists (select 1 from public.events e where e.id = public.bookings.event_id)
    or
    -- admin-created events visible only to the owning organizer
    exists (
      select 1 from public.events e
      where e.id = public.bookings.event_id
        and e.organizer_id = auth.uid()
    )
  )
);

-- Checkins: any authenticated user (organizer) can read and insert
create policy "checkins_org_read"   on public.checkins for select using (auth.uid() is not null);
create policy "checkins_org_insert" on public.checkins for insert with check (auth.uid() is not null);
