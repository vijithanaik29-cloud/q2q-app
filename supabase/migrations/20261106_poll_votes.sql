create table if not exists poll_votes (
  id uuid default gen_random_uuid() primary key,
  question_id text not null default 'book_intent',
  vote text not null check (vote in ('yes', 'no')),
  created_at timestamptz default now()
);

alter table poll_votes enable row level security;

create policy "Anyone can insert a vote" on poll_votes
  for insert with check (true);

create policy "Anyone can read vote counts" on poll_votes
  for select using (true);
