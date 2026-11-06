-- Phase 1: Community features — profiles, likes, comments

-- fix stories content length to match UI (1200 chars)
alter table stories drop constraint if exists stories_content_check;
alter table stories add constraint stories_content_check
  check (char_length(content) between 10 and 1200);

-- link stories to community users (nullable — existing anonymous stories keep null)
alter table stories
  add column if not exists user_id uuid references auth.users on delete set null;

-- allow users to see their own pending stories
create policy "users_see_own_stories"
  on stories for select to authenticated
  using (auth.uid() = user_id);

-- ── profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null,
  city         text,
  bio          text,
  is_mentor    boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_own_insert"  on profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update"  on profiles for update using (auth.uid() = id);

-- ── story_likes ───────────────────────────────────────────────────────────────
create table if not exists story_likes (
  story_id   uuid not null references stories(id) on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);
alter table story_likes enable row level security;
create policy "likes_public_read" on story_likes for select using (true);
create policy "likes_own_insert"  on story_likes for insert with check (auth.uid() = user_id);
create policy "likes_own_delete"  on story_likes for delete using (auth.uid() = user_id);

create index if not exists story_likes_story_id_idx on story_likes (story_id);

-- ── story_comments ────────────────────────────────────────────────────────────
create table if not exists story_comments (
  id           bigserial primary key,
  story_id     uuid not null references stories(id) on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  display_name text not null,
  content      text not null check (char_length(content) between 1 and 500),
  is_flagged   boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table story_comments enable row level security;
create policy "comments_public_read" on story_comments for select using (not is_flagged);
create policy "comments_own_insert"  on story_comments for insert with check (auth.uid() = user_id);
create policy "comments_own_delete"  on story_comments for delete using (auth.uid() = user_id);

create index if not exists story_comments_story_id_idx on story_comments (story_id);
