-- Prevent having both a score and an 11/10 flag simultaneously
alter table public.ratings
  drop constraint if exists ratings_exclusive_score_eleven;

alter table public.ratings
  add constraint ratings_exclusive_score_eleven
  check (NOT (is_eleven_out_of_ten = true AND score_overall IS NOT NULL));
