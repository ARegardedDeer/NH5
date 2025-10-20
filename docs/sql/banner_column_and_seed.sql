-- NH5: user_profiles.banner_anime_id and seed default from 11/10 (fallback top-1)
alter table public.user_profiles
  add column if not exists banner_anime_id uuid;

do $$ begin
  alter table public.user_profiles
    add constraint user_profiles_banner_anime_fkey
    foreign key (banner_anime_id) references public.anime(id);
exception when duplicate_object then null; end $$;

-- Default to the current 11/10 if present…
update public.user_profiles p
set banner_anime_id = ue.anime_id
from public.user_eleven ue
where p.banner_anime_id is null
  and p.user_id = ue.user_id;

-- …otherwise fallback to top-list position 1
update public.user_profiles p
set banner_anime_id = utl.anime_id
from public.user_top_list utl
where p.banner_anime_id is null
  and p.user_id = utl.user_id
  and utl.position = 1;

-- Read-only sanity
select user_id, banner_anime_id from public.user_profiles limit 3;
