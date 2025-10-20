-- Create table if needed
create table if not exists public.user_eleven (
  user_id uuid primary key references public.users(id) on delete cascade,
  anime_id uuid not null references public.anime(id) on delete restrict,
  created_at timestamp with time zone default now()
);

-- Optional RLS (enable + open read to all; writes limited to owner)
alter table public.user_eleven enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_eleven' and policyname = 'user_eleven_select_all'
  ) then
    create policy "user_eleven_select_all"
      on public.user_eleven for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_eleven' and policyname = 'user_eleven_upsert_owner'
  ) then
    create policy "user_eleven_upsert_owner"
      on public.user_eleven for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_eleven' and policyname = 'user_eleven_update_owner'
  ) then
    create policy "user_eleven_update_owner"
      on public.user_eleven for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Seed demo user's 11/10 from top-list position 1 (falls back if none)
insert into public.user_eleven (user_id, anime_id)
select
  '1c16d367-73f0-478b-b434-aa3cce20981d'::uuid,
  utl.anime_id
from public.user_top_list utl
where utl.user_id = '1c16d367-73f0-478b-b434-aa3cce20981d'::uuid
order by utl.position asc
limit 1
on conflict (user_id) do update set anime_id = excluded.anime_id;

-- Verify
select ue.user_id, ue.anime_id, a.title, a.thumbnail_url
from public.user_eleven ue
left join public.anime a on a.id = ue.anime_id
where ue.user_id = '1c16d367-73f0-478b-b434-aa3cce20981d';
