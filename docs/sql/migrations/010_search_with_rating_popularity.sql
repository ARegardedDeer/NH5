-- Migration: Use rating scores as popularity signal
-- Date: 2025-12-04
-- Issue: Migration 009 uses title length, but we have actual rating data!
-- Fix: Use average score_overall from ratings table as popularity metric

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
  -- Calculate rating-based popularity (0-100)
  rating_popularity AS (
    SELECT
      anime_id,
      COUNT(*) AS rating_count,
      AVG(score_overall) AS avg_score,
      -- Popularity formula:
      -- - Higher avg_score = better (scaled to 0-60)
      -- - More ratings = more popular (scaled to 0-40, log scale)
      LEAST(100, (
        -- Average score component (0-60 points)
        -- Score range: 1-10 → 0-60 points
        (COALESCE(AVG(score_overall), 5) - 1) * 6.67 +
        -- Rating count component (0-40 points, logarithmic)
        -- 1 rating = 0, 10 ratings = 20, 100+ ratings = 40
        LEAST(40, LOG(GREATEST(COUNT(*), 1)) * 10)
      )) AS popularity_score
    FROM public.ratings
    WHERE score_overall IS NOT NULL  -- Exclude 11/10 ratings (is_eleven_out_of_ten)
    GROUP BY anime_id
  ),

  -- Fallback popularity for anime with NO ratings (0-50)
  fallback_popularity AS (
    SELECT
      a.id AS anime_id,
      LEAST(50, (
        -- Shorter titles = likely main series
        50 - LEAST(40, (LENGTH(a.title) - 5) / 2) +
        -- Series bonus (>12 episodes)
        CASE WHEN a.episodes_count > 12 THEN 10 ELSE 0 END +
        -- Recency bonus
        CASE WHEN a.created_at > NOW() - INTERVAL '1 year' THEN 5 ELSE 0 END
      )) AS fallback_score
    FROM public.anime a
  ),

  -- Combined popularity scores
  popularity_scores AS (
    SELECT
      a.id AS anime_id,
      CASE
        -- If ratings exist, use them (prioritize real data)
        WHEN rp.rating_count > 0 THEN
          rp.popularity_score
        -- Otherwise, use fallback heuristics
        ELSE
          COALESCE(fp.fallback_score, 0)
      END AS popularity_score,
      -- Also include user_lists engagement
      COALESCE(ul.user_count, 0) AS list_count
    FROM public.anime a
    LEFT JOIN rating_popularity rp ON rp.anime_id = a.id
    LEFT JOIN fallback_popularity fp ON fp.anime_id = a.id
    LEFT JOIN (
      SELECT anime_id, COUNT(*) AS user_count
      FROM user_lists
      GROUP BY anime_id
    ) ul ON ul.anime_id = a.id
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
      -- Boost slightly if also in user_lists (signal of engagement beyond rating)
      COALESCE(ps.popularity_score, 0) +
        CASE WHEN ps.list_count > 5 THEN 10 ELSE 0 END AS popularity_bonus
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
