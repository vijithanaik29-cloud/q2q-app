create table if not exists influencers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  name       text,
  expires_at timestamptz not null default (now() + interval '1 year'),
  active     boolean not null default true,
  created_at timestamptz default now()
);
alter table influencers enable row level security;
