import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook to manually invalidate the anime search cache.
 * Useful when database functions change and you need to bypass stale cache.
 *
 * WHAT IS CACHE INVALIDATION?
 * ---------------------------
 * React Query caches API responses to avoid redundant network requests.
 * When you search for "naruto", the results are cached for 5 minutes (staleTime).
 *
 * If you search "naruto" again within 5 minutes, React Query returns the CACHED
 * results instead of making a new API call. This is fast but can show stale data.
 *
 * Cache invalidation FORCES React Query to:
 * 1. Mark cached data as "stale" (outdated)
 * 2. Re-fetch from the API on the next query
 * 3. Replace old cache with fresh data
 *
 * WHY DO WE NEED THIS?
 * --------------------
 * When the database search_anime() function changes (via migrations), the API
 * response shape or behavior changes, but React Query still serves OLD cached results.
 *
 * Invalidating the cache ensures the next search calls the NEW function version.
 *
 * EXAMPLE SCENARIO:
 * -----------------
 * 1. You search "naruto" → returns [{id, title, tags}] (cached)
 * 2. Migration 006 changes function to return "genres" instead of "tags"
 * 3. You search "naruto" again → React Query returns OLD cache with "tags"
 * 4. Call invalidateSearchCache() → clears cache
 * 5. You search "naruto" again → NEW API call returns "genres"
 *
 * USAGE:
 * ------
 * const invalidateCache = useInvalidateSearchCache();
 *
 * // In a button or effect:
 * invalidateCache(); // Clears all search caches
 * invalidateCache('naruto'); // Clears only "naruto" search cache
 */
export const useInvalidateSearchCache = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (specificQuery?: string) => {
      if (specificQuery) {
        // Invalidate specific search query cache
        console.log('[Cache] 🗑️ Invalidating cache for query:', specificQuery);
        queryClient.invalidateQueries({
          queryKey: ['anime-search', specificQuery],
          exact: true,
        });
      } else {
        // Invalidate ALL search caches
        console.log('[Cache] 🗑️ Invalidating ALL anime search caches');
        queryClient.invalidateQueries({
          queryKey: ['anime-search'],
          exact: false, // Match all queries starting with 'anime-search'
        });
      }

      // Also clear the query cache entirely (nuclear option)
      // Uncomment if invalidateQueries doesn't work:
      // queryClient.clear();
    },
    [queryClient]
  );
};

/**
 * Hook to completely reset the React Query client.
 * This is the "nuclear option" - clears ALL caches, not just search.
 * Use when invalidateQueries doesn't work (rare edge cases).
 */
export const useResetQueryCache = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    console.log('[Cache] ☢️ NUCLEAR: Clearing ALL React Query caches');
    queryClient.clear();
    console.log('[Cache] ✅ All caches cleared. Next queries will fetch fresh.');
  }, [queryClient]);
};
