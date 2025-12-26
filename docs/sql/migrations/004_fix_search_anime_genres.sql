-- Migration: Fix search_anime to use tags column (no a.genres)
-- Date: 2025-12-04
-- Context: search_anime RPC referenced a non-existent column a.genres, causing
--          runtime errors like "column a.genres does not exist" when calling
--          the smart search hook. The anime table stores tags, not genres.
--          This replaces the function to return tags as genres and uses a
--          simple ILIKE/tags match for compatibility.

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
