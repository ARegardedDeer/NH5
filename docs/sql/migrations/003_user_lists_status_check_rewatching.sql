-- Ensure user_lists.status allows Title Case values used by the app (including Rewatching)
ALTER TABLE public.user_lists
  DROP CONSTRAINT IF EXISTS user_lists_status_check;

ALTER TABLE public.user_lists
  ADD CONSTRAINT user_lists_status_check
  CHECK (status IN (
    'Watching',
    'Rewatching',
    'Plan to Watch',
    'On Hold',
    'Completed',
    'Dropped'
  ));
