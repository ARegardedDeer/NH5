-- NH5 RPC: Atomic set 11/10 highlight (one per user)
-- This function atomically updates both user_eleven and ratings tables
-- to avoid race conditions and constraint violations
--
-- Usage: await supabase.rpc('nh5_set_eleven', { p_anime_id: 'anime-123' })

-- Drop old version first
DROP FUNCTION IF EXISTS public.nh5_set_eleven(p_anime_id text);

CREATE OR REPLACE FUNCTION public.nh5_set_eleven(p_anime_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is null';
  END IF;

  -- Per-user advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(
    ('x' || substr(replace(v_uid::text, '-', ''), 1, 16))::bit(64)::bigint
  );

  -- Delete any existing 11.0 ratings for this user (ensures one 11/10)
  DELETE FROM public.ratings
   WHERE user_id = v_uid
     AND score_overall = 11.0;

  -- Insert or update rating to 11.0 (no updated_at column)
  INSERT INTO public.ratings (user_id, anime_id, score_overall, created_at)
  VALUES (v_uid, p_anime_id, 11.0, now())
  ON CONFLICT (user_id, anime_id)
  DO UPDATE SET score_overall = 11.0;

END;
$$;

-- Grant execute to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.nh5_set_eleven(text) TO anon, authenticated;
