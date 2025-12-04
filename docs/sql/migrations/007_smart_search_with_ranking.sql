-- Migration: Smart search with relevance ranking (fixes "AS" matching "Fantasy")
-- Date: 2025-12-04
-- Issue: Simple ILIKE matches "AS" in ".hack//G.U." because "Fantasy" contains "as"
-- Fix: Add relevance scoring to prioritize better matches

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
  WITH scored_results AS (
    SELECT
      a.id,
      a.title,
      a.thumbnail_url,
      a.tags AS genres,
      a.synopsis,
      a.episodes_count,
      -- Relevance scoring (higher = better match)
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
      END AS relevance_score
    FROM public.anime a
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
    sr.relevance_score
  FROM scored_results sr
  ORDER BY
    sr.relevance_score DESC,  -- Best matches first
    sr.title ASC              -- Alphabetical within same score
  LIMIT 20;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO anon;

-- Test query to verify ranking
-- Expected: "Assassination Classroom" should rank higher than ".hack//G.U." for "AS"
DO $$
DECLARE
  result_count integer;
  top_title text;
BEGIN
  SELECT title INTO top_title
  FROM public.search_anime('AS')
  LIMIT 1;

  RAISE NOTICE 'Top result for "AS": %', COALESCE(top_title, 'No results');
END $$;
