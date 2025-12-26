-- Migration: Normalize search_anime signature (remove overload ambiguity)
-- Date: 2025-12-04
-- Issue: PGRST203 "Could not choose the best candidate function" because multiple
--        search_anime overloads existed (e.g., search_anime(text), search_anime()).
-- Fix: Drop all overloads, recreate a single stable function search_anime(search_term text)
--      using tags as genres to match the app's expected shape.

DO $$
BEGIN
  PERFORM 1;
  -- Drop any overloads that might conflict
  DROP FUNCTION IF EXISTS public.search_anime();
  DROP FUNCTION IF EXISTS public.search_anime(text);
  DROP FUNCTION IF EXISTS public.search_anime(search_term text);
EXCEPTION WHEN undefined_function THEN
  NULL;
END
$$;

CREATE OR REPLACE FUNCTION public.search_anime(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  thumbnail_url text,
  genres text[],
  synopsis text,
  episodes_count integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.id,
    a.title,
    a.thumbnail_url,
    a.tags AS genres,
    a.synopsis,
    a.episodes_count
  FROM public.anime a
  WHERE
    a.title ILIKE '%' || search_term || '%'
    OR EXISTS (
      SELECT 1
      FROM unnest(COALESCE(a.tags, '{}')) t(tag)
      WHERE t.tag ILIKE '%' || search_term || '%'
    )
  ORDER BY a.title
  LIMIT 20;
$$;
