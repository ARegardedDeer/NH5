-- Migration: Add hybrid popularity (user engagement + fallback to title length)
-- Date: 2025-12-04
-- Issue: Migration 008 doesn't help when user_lists is empty/sparse
-- Fix: Use title length + recency as fallback popularity signal

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
  -- Calculate user engagement popularity (0-100)
  user_popularity AS (
    SELECT
      anime_id,
      COUNT(*) AS user_count,
      COUNT(*) FILTER (WHERE status = 'Completed') AS completed_count,
      COUNT(*) FILTER (WHERE status IN ('Watching', 'Rewatching')) AS active_count,
      MAX(updated_at) AS last_activity
    FROM user_lists
    GROUP BY anime_id
  ),

  -- Calculate fallback popularity for anime with no user data (0-50)
  -- Shorter titles = more likely to be well-known (e.g., "Naruto" vs "Naruto: Some Movie Vol. 3")
  fallback_popularity AS (
    SELECT
      a.id AS anime_id,
      LEAST(50, (
        -- Shorter titles get higher score (main series vs movies/specials)
        50 - LEAST(40, (LENGTH(a.title) - 5) / 2) +
        -- Bonus for having episodes (series vs movies)
        CASE WHEN a.episodes_count > 12 THEN 10 ELSE 0 END +
        -- Slight recency bonus (newer anime in DB)
        CASE WHEN a.created_at > NOW() - INTERVAL '1 year' THEN 5 ELSE 0 END
      )) AS fallback_score
    FROM public.anime a
  ),

  -- Combined popularity scores
  popularity_scores AS (
    SELECT
      a.id AS anime_id,
      CASE
        -- If user data exists, use it (prioritize real engagement)
        WHEN up.user_count > 0 THEN
          LEAST(100, (
            LEAST(50, up.user_count * 10) +
            CASE WHEN up.completed_count > 5 THEN 30 ELSE 0 END +
            CASE WHEN up.active_count > 0 THEN 10 ELSE 0 END +
            CASE WHEN up.last_activity > NOW() - INTERVAL '30 days' THEN 10 ELSE 0 END
          ))
        -- Otherwise, use fallback heuristics
        ELSE
          COALESCE(fp.fallback_score, 0)
      END AS popularity_score
    FROM public.anime a
    LEFT JOIN user_popularity up ON up.anime_id = a.id
    LEFT JOIN fallback_popularity fp ON fp.anime_id = a.id
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
    (sr.base_relevance_score + (sr.popularity_bonus * 5)) AS relevance_score
  FROM scored_results sr
  ORDER BY
    (sr.base_relevance_score + (sr.popularity_bonus * 5)) DESC,
    sr.title ASC
  LIMIT 20;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO anon;

-- Test query
DO $$
DECLARE
  top_title text;
  top_score integer;
BEGIN
  SELECT title, relevance_score INTO top_title, top_score
  FROM public.search_anime('Na')
  LIMIT 1;

  RAISE NOTICE 'Top result for "Na": % (score: %)', COALESCE(top_title, 'No results'), COALESCE(top_score, 0);
END $$;
