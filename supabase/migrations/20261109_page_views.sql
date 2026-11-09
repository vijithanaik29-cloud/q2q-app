-- ── Page view tracker ────────────────────────────────────────────────────────

create table if not exists page_views (
  id         bigint generated always as identity primary key,
  path       text        not null,
  referrer   text,
  session_id text,
  created_at timestamptz not null default now()
);

alter table page_views enable row level security;

-- Anyone (anon) can insert a page view
create policy "anon_insert_page_views"
  on page_views for insert to anon, authenticated
  with check (true);

-- Only authenticated users can read (superadmin analytics)
create policy "auth_select_page_views"
  on page_views for select to authenticated
  using (true);

-- Index for fast analytics queries
create index if not exists page_views_created_at_idx on page_views (created_at desc);
create index if not exists page_views_path_idx on page_views (path);
