-- Migration: Aggressively drop ALL search_anime overloads and recreate clean
-- Date: 2025-12-04
-- Issue: PGRST203 still occurs after migration 005, suggesting multiple function
--        signatures still exist in the database (possibly cached or schema variations)
-- Fix: Use DROP FUNCTION CASCADE with all possible signatures, then recreate single stable function

-- Drop all possible overload combinations aggressively
DROP FUNCTION IF EXISTS public.search_anime() CASCADE;
DROP FUNCTION IF EXISTS public.search_anime(text) CASCADE;
DROP FUNCTION IF EXISTS public.search_anime(search_term text) CASCADE;
DROP FUNCTION IF EXISTS public.search_anime(varchar) CASCADE;
DROP FUNCTION IF EXISTS public.search_anime(search_term varchar) CASCADE;

-- Verify no search_anime functions remain
DO $$
DECLARE
  func_count integer;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname = 'search_anime';

  IF func_count > 0 THEN
    RAISE NOTICE 'Warning: % search_anime function(s) still exist after DROP', func_count;
  ELSE
    RAISE NOTICE 'Success: All search_anime functions removed';
  END IF;
END $$;

-- Create single canonical function with explicit parameter name and type
CREATE FUNCTION public.search_anime(search_term text)
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
SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_anime(text) TO anon;

-- Verify function was created successfully
DO $$
DECLARE
  func_count integer;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname = 'search_anime';

  RAISE NOTICE 'Final count: % search_anime function(s) exist', func_count;

  IF func_count != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 search_anime function, found %', func_count;
  END IF;
END $$;
