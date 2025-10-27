-- NH5 Migration: Enforce one 11/10 highlight per user
-- This migration is idempotent and safe to run multiple times

-- Ensure table exists
CREATE TABLE IF NOT EXISTS user_eleven (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Clean up duplicates BEFORE changing PK (keep most recent per user)
DELETE FROM user_eleven a
USING (
  SELECT user_id, MAX(created_at) as max_created
  FROM user_eleven
  GROUP BY user_id
) b
WHERE a.user_id = b.user_id
  AND a.created_at < b.max_created;

-- Drop old PK if it was (user_id, anime_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_eleven_pkey'
      AND conrelid = 'public.user_eleven'::regclass
  ) THEN
    ALTER TABLE user_eleven DROP CONSTRAINT user_eleven_pkey;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- noop
END$$;

-- Enforce ONE ROW per user (one 11/10 highlight)
DO $$
BEGIN
  -- Only add PK if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_eleven_pkey'
      AND conrelid = 'public.user_eleven'::regclass
  ) THEN
    ALTER TABLE user_eleven
      ADD CONSTRAINT user_eleven_pkey PRIMARY KEY (user_id);
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- noop
END$$;

-- Ratings must allow 11.0 in range
ALTER TABLE ratings
  ALTER COLUMN score_overall TYPE numeric(3,1);

-- Drop any legacy constraint that capped at 10
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ratings_score_overall_check'
      AND conrelid = 'public.ratings'::regclass
  ) THEN
    ALTER TABLE ratings DROP CONSTRAINT ratings_score_overall_check;
  END IF;
EXCEPTION WHEN undefined_table THEN
END$$;

-- Create/replace a single correct range constraint allowing 11.0 max
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ratings_score_range'
      AND conrelid = 'public.ratings'::regclass
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_score_range CHECK (score_overall >= 1.0 AND score_overall <= 11.0);
  END IF;
END$$;

-- (Optional) index for ratings summary queries per anime
CREATE INDEX IF NOT EXISTS idx_ratings_anime ON ratings(anime_id);
