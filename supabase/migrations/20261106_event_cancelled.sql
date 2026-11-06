alter table events
  add column if not exists is_cancelled boolean not null default false;
