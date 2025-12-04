-- Migration: Add popularity boost to search ranking
-- Date: 2025-12-04
-- Issue: Search doesn't prioritize popular titles (e.g., "Naruto" vs "Naruto: Lost Tower")
-- Fix: Boost relevance score based on user engagement metrics

DROP FUNCTION IF EXISTS public.search_anime(text) CASCADE;

CREATE FUNCTION public.search_anime(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  thumbnail_url text,
  genres text[],
  synopsis text,
  episodes_count integer,
  relevance_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH
  -- Calculate popularity metrics for each anime
  popularity_metrics AS (
    SELECT
      anime_id,
      COUNT(*) AS user_count,                       -- How many users have it
      COUNT(*) FILTER (WHERE status = 'Completed') AS completed_count,  -- Completion rate (indicator of quality)
      COUNT(*) FILTER (WHERE status IN ('Watching', 'Rewatching')) AS active_count,  -- Currently active
      MAX(updated_at) AS last_activity              -- Recency of activity
    FROM user_lists
    GROUP BY anime_id
  ),

  -- Calculate popularity score (0-100)
  popularity_scores AS (
    SELECT
      anime_id,
      LEAST(100, (
        -- Base: 10 points per user (capped at 50)
        LEAST(50, user_count * 10) +
        -- Bonus: 30 points if >5 completions (quality signal)
        CASE WHEN completed_count > 5 THEN 30 ELSE 0 END +
        -- Bonus: 10 points if actively watched (trending)
        CASE WHEN active_count > 0 THEN 10 ELSE 0 END +
        -- Bonus: 10 points if activity within last 30 days
        CASE WHEN last_activity > NOW() - INTERVAL '30 days' THEN 10 ELSE 0 END
      )) AS popularity_score
    FROM popularity_metrics
  ),

  -- Score search matches
  scored_results AS (
    SELECT
      a.id,
      a.title,
      a.thumbnail_url,
      a.tags AS genres,
      a.synopsis,
      a.episodes_count,
      -- Base relevance scoring (higher = better match)
      CASE
        -- Perfect exact match (case-insensitive)
        WHEN LOWER(a.title) = LOWER(search_term) THEN 1000

        -- Starts with search term (e.g., "Naruto" matches "Nar")
        WHEN LOWER(a.title) LIKE LOWER(search_term) || '%' THEN 900

        -- Word boundary match (e.g., "One Piece" matches "One")
        WHEN LOWER(a.title) LIKE '% ' || LOWER(search_term) || '%' THEN 800

        -- Contains as separate word with punctuation (e.g., ".hack//AS")
        WHEN LOWER(a.title) LIKE '%/' || LOWER(search_term) || '%'
          OR LOWER(a.title) LIKE '%.' || LOWER(search_term) || '%'
          OR LOWER(a.title) LIKE '%-' || LOWER(search_term) || '%' THEN 700

        -- Title contains search term (substring match)
        WHEN LOWER(a.title) LIKE '%' || LOWER(search_term) || '%' THEN 600

        -- Genre exact match
        WHEN EXISTS (
          SELECT 1
          FROM unnest(COALESCE(a.tags, '{}')) t(tag)
          WHERE LOWER(t.tag) = LOWER(search_term)
        ) THEN 500

        -- Genre starts with
        WHEN EXISTS (
          SELECT 1
          FROM unnest(COALESCE(a.tags, '{}')) t(tag)
          WHERE LOWER(t.tag) LIKE LOWER(search_term) || '%'
        ) THEN 400

        -- Genre contains
        WHEN EXISTS (
          SELECT 1
          FROM unnest(COALESCE(a.tags, '{}')) t(tag)
          WHERE LOWER(t.tag) LIKE '%' || LOWER(search_term) || '%'
        ) THEN 300

        ELSE 100
      END AS base_relevance_score,

      -- Add popularity bonus (0-100)
      COALESCE(ps.popularity_score, 0) AS popularity_bonus
    FROM public.anime a
    LEFT JOIN popularity_scores ps ON ps.anime_id = a.id
    WHERE
      -- Only include results that actually match
      LOWER(a.title) LIKE '%' || LOWER(search_term) || '%'
      OR EXISTS (
        SELECT 1
        FROM unnest(COALESCE(a.tags, '{}')) t(tag)
        WHERE LOWER(t.tag) LIKE '%' || LOWER(search_term) || '%'
      )
  )
  SELECT
    sr.id,
    sr.title,
    sr.thumbnail_url,
    sr.genres,
    sr.synopsis,
    sr.episodes_count,
    -- Final score = base relevance + (popularity bonus × 5)
    -- This gives popularity significant weight (0-500 range vs 0-1000 base)
    (sr.base_relevance_score + (sr.popularity_bonus * 5)) AS relevance_score
  FROM scored_results sr
  ORDER BY
    (sr.base_relevance_score + (sr.popularity_bonus * 5)) DESC,  -- Best matches + strongly boosted popularity
    sr.title ASC                                                   -- Alphabetical within same score
  LIMIT 20;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO anon;

-- Test query
-- Expected: Popular "Naruto" should rank higher than obscure "Naruto: Lost Tower" for "Naruto"
DO $$
DECLARE
  top_title text;
  top_score integer;
BEGIN
  SELECT title, relevance_score INTO top_title, top_score
  FROM public.search_anime('Naruto')
  LIMIT 1;

  RAISE NOTICE 'Top result for "Naruto": % (score: %)', COALESCE(top_title, 'No results'), COALESCE(top_score, 0);
END $$;
