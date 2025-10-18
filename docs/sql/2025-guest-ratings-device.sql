-- NH5 guest ratings: device_user_id path (keep user_id FK for future auth)
-- Safe to run multiple times.

-- 1. Add device_user_id (nullable to preserve legacy rows)
alter table public.ratings
  add column if not exists device_user_id uuid;

-- 2. Ensure core columns exist
-- (user_id remains with its FK to public.users(id); no change here)

-- 3. One rating per device per anime (only for device-mode rows)
create unique index if not exists ratings_device_anime_unique
  on public.ratings (device_user_id, anime_id)
  where device_user_id is not null;

-- Optional: if you already had a unique index on (user_id, anime_id), keep it.
-- Otherwise, you may add:
-- create unique index if not exists ratings_user_anime_unique
--   on public.ratings (user_id, anime_id)
--   where user_id is not null;

-- 4. RLS: allow anon to insert/update ONLY device rows (user_id must remain null)
alter table public.ratings enable row level security;

-- Insert policy for anon device ratings
create policy if not exists "anon_insert_device_ratings"
on public.ratings
for insert
to anon
with check (
  -- device path only; real user rows are off-limits for anon
  user_id is null
);

-- Update policy for anon device ratings
create policy if not exists "anon_update_device_ratings"
on public.ratings
for update
to anon
using (
  user_id is null
)
with check (
  user_id is null
);

-- (Optional) Read policy for anon if you want the app to read ratings:
create policy if not exists "anon_select_device_ratings"
on public.ratings
for select
to anon
using (true);
