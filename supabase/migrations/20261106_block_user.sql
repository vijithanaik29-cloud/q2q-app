-- ── Block user support ───────────────────────────────────────────────────────

alter table profiles add column if not exists is_blocked boolean not null default false;

-- RPC: only the superadmin email can block/unblock any user
create or replace function block_user(target_user_id uuid, block_state boolean default true)
returns void language plpgsql security definer as $$
begin
  if (select email from auth.users where id = auth.uid()) != 'vijithanaik29@gmail.com' then
    raise exception 'unauthorized';
  end if;
  update profiles set is_blocked = block_state where id = target_user_id;
end;
$$;
