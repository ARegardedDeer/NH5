-- ═══════════════════════════════════════════════════════
-- Migration: Continue Watching Support
-- Date: 2024-11-29
-- Description: Add episode tracking, multi-season anime support, and rewatch functionality
--
-- Changes:
-- 1. Create anime_series table (umbrella for multi-season anime)
-- 2. Update anime table (add series_id, season_number, has_specials)
-- 3. Update user_lists table (add episode tracking columns)
-- 4. Create indexes for performance
-- 5. Backfill existing data with safe defaults
-- ═══════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════
-- STEP 1: Create anime_series table (umbrella/parent)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS anime_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  total_seasons INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE anime_series IS 'Umbrella table for multi-season anime (e.g., Attack on Titan with 4 seasons)';

-- ═══════════════════════════════════════════════════════
-- STEP 2: Update anime table to support seasons
-- ═══════════════════════════════════════════════════════

-- Add series relationship columns
ALTER TABLE anime
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES anime_series(id),
ADD COLUMN IF NOT EXISTS season_number INTEGER,
ADD COLUMN IF NOT EXISTS has_specials BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN anime.series_id IS 'Links to anime_series for multi-season shows (NULL for standalone anime)';
COMMENT ON COLUMN anime.season_number IS 'Season number (1, 2, 3...) for multi-season anime (NULL for standalone)';
COMMENT ON COLUMN anime.has_specials IS 'Whether this anime has special episodes (allows .5 episode numbers)';

-- Add index for series lookup
CREATE INDEX IF NOT EXISTS idx_anime_series
ON anime(series_id, season_number)
WHERE series_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- STEP 3: Update user_lists table for episode tracking
-- ═══════════════════════════════════════════════════════

-- Add episode tracking columns
ALTER TABLE user_lists
ADD COLUMN IF NOT EXISTS current_episode DECIMAL(5,1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_episodes INTEGER;

-- Add timestamp columns
ALTER TABLE user_lists
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_watched_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS original_completed_at TIMESTAMP;

-- Add rewatch tracking
ALTER TABLE user_lists
ADD COLUMN IF NOT EXISTS rewatch_count INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN user_lists.current_episode IS 'Current episode user is on (supports .5 for specials)';
COMMENT ON COLUMN user_lists.total_episodes IS 'Total episodes (cached from anime.episodes_count)';
COMMENT ON COLUMN user_lists.started_at IS 'When user started watching (first episode)';
COMMENT ON COLUMN user_lists.last_watched_at IS 'Most recent episode watch timestamp';
COMMENT ON COLUMN user_lists.completed_at IS 'Most recent completion date (updates on rewatch)';
COMMENT ON COLUMN user_lists.original_completed_at IS 'First completion date (preserved on rewatch)';
COMMENT ON COLUMN user_lists.rewatch_count IS 'Number of times rewatched';

-- ═══════════════════════════════════════════════════════
-- STEP 4: Backfill existing data with safe defaults
-- ═══════════════════════════════════════════════════════

-- Backfill total_episodes from anime table
UPDATE user_lists ul
SET total_episodes = a.episodes_count
FROM anime a
WHERE ul.anime_id = a.id
  AND ul.total_episodes IS NULL;

-- Backfill for completed anime (assume they watched all episodes)
UPDATE user_lists
SET
  current_episode = COALESCE(total_episodes, 1),
  started_at = COALESCE(started_at, created_at),
  last_watched_at = COALESCE(last_watched_at, created_at),
  completed_at = COALESCE(completed_at, created_at),
  original_completed_at = COALESCE(original_completed_at, created_at)
WHERE status = 'completed'
  AND current_episode IS NULL;

-- Backfill for watching anime (assume on episode 1)
UPDATE user_lists
SET
  current_episode = COALESCE(current_episode, 1),
  started_at = COALESCE(started_at, created_at),
  last_watched_at = COALESCE(last_watched_at, created_at)
WHERE status = 'watching'
  AND current_episode IS NULL;

-- Backfill for plan_to_watch (set to episode 0, not started yet)
UPDATE user_lists
SET current_episode = 0
WHERE status = 'plan_to_watch'
  AND current_episode IS NULL;

-- Backfill for on_hold and dropped (assume episode 1 if unknown)
UPDATE user_lists
SET
  current_episode = COALESCE(current_episode, 1),
  started_at = COALESCE(started_at, created_at),
  last_watched_at = COALESCE(last_watched_at, created_at)
WHERE status IN ('on_hold', 'dropped')
  AND current_episode IS NULL;

-- ═══════════════════════════════════════════════════════
-- STEP 5: Create indexes for performance
-- ═══════════════════════════════════════════════════════

-- Critical index for Continue Watching queries (most important!)
CREATE INDEX IF NOT EXISTS idx_continue_watching
ON user_lists(user_id, status, last_watched_at DESC)
WHERE status IN ('watching', 'rewatching');

-- Index for user's full list view by status
CREATE INDEX IF NOT EXISTS idx_user_lists_status
ON user_lists(user_id, status, created_at DESC);

-- Index for completion queries
CREATE INDEX IF NOT EXISTS idx_user_lists_completed
ON user_lists(user_id, completed_at DESC)
WHERE status = 'completed' AND completed_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- STEP 6: Verification queries (run these to confirm migration)
-- ═══════════════════════════════════════════════════════

-- Verify anime_series table created
SELECT
  'anime_series table exists' as check_name,
  COUNT(*) as current_count
FROM anime_series;

-- Verify new columns exist in anime
SELECT
  'anime table new columns' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'anime'
  AND column_name IN ('series_id', 'season_number', 'has_specials')
ORDER BY column_name;

-- Verify new columns exist in user_lists
SELECT
  'user_lists table new columns' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_lists'
  AND column_name IN ('current_episode', 'total_episodes', 'started_at', 'last_watched_at', 'completed_at', 'original_completed_at', 'rewatch_count')
ORDER BY column_name;

-- Verify indexes created
SELECT
  'Indexes created' as check_name,
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('user_lists', 'anime')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check backfill results by status
SELECT
  'Backfill results' as check_name,
  status,
  COUNT(*) as total_count,
  COUNT(current_episode) as has_current_episode,
  COUNT(started_at) as has_started_at,
  COUNT(completed_at) as has_completed_at
FROM user_lists
GROUP BY status
ORDER BY status;

-- Check for any NULL current_episodes (should only be plan_to_watch with 0)
SELECT
  'Remaining NULLs check' as check_name,
  status,
  COUNT(*) as null_episode_count
FROM user_lists
WHERE current_episode IS NULL
GROUP BY status;

-- ═══════════════════════════════════════════════════════
-- Migration Complete!
--
-- Next steps:
-- 1. Review verification query results above
-- 2. Check for any errors or warnings
-- 3. Test Continue Watching queries in your app
--
-- Rollback (if needed):
-- - These changes are additive (new tables, new columns)
-- - To rollback, drop the new columns and table
-- - But data will be lost, so backup first!
-- ═══════════════════════════════════════════════════════
