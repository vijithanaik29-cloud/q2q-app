create table if not exists stories (
  id         uuid primary key default gen_random_uuid(),
  content    text not null check (char_length(content) between 10 and 600),
  city       text,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);
alter table stories enable row level security;

-- Anyone (including anonymous) can submit
create policy "anyone can submit a story"
  on stories for insert to anon, authenticated
  with check (true);

-- Only approved stories visible to public
create policy "approved stories are public"
  on stories for select to anon, authenticated
  using (status = 'approved');

-- Superadmin can read all and update status
create policy "superadmin manages stories"
  on stories for all to authenticated
  using (auth.jwt() ->> 'email' = 'vijithanaik29@gmail.com')
  with check (auth.jwt() ->> 'email' = 'vijithanaik29@gmail.com');
