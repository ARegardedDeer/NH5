import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

interface UseAnimeSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
}

interface AnimeSearchResult {
  id: string;
  title: string;
  thumbnail_url: string | null;
  genres: string[] | null;
  synopsis: string | null;
  episodes_count: number | null;
}

export const useAnimeSearch = (
  searchQuery: string,
  { enabled = true, debounceMs = 300 }: UseAnimeSearchOptions = {}
) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  return useQuery<AnimeSearchResult[]>({
    queryKey: ['anime-search', debouncedQuery],
    queryFn: async () => {
      // Don't search if query is too short
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      console.log('[useAnimeSearch] 🔍 Smart search for:', debouncedQuery);
      console.log('[useAnimeSearch] 📡 Calling RPC with params:', { search_term: debouncedQuery });

      const startTime = Date.now();

      // Call the hybrid search function
      const { data, error } = await supabase
        .rpc('search_anime', { search_term: debouncedQuery });

      const duration = Date.now() - startTime;

      if (error) {
        console.error('[useAnimeSearch] ❌ Error after', duration + 'ms');
        console.error('[useAnimeSearch] Error code:', error.code);
        console.error('[useAnimeSearch] Error message:', error.message);
        console.error('[useAnimeSearch] Error details:', error.details);
        console.error('[useAnimeSearch] Error hint:', error.hint);
        console.error('[useAnimeSearch] Full error object:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[useAnimeSearch] ✅ Success after', duration + 'ms');
      console.log('[useAnimeSearch] Found', data?.length || 0, 'results');

      // Log first result for debugging
      if (data && data.length > 0) {
        console.log('[useAnimeSearch] Top result:', data[0].title);
        console.log('[useAnimeSearch] First result shape:', Object.keys(data[0]));
      }

      return data || [];
    },
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Cache invalidation: Set to 0 to always fetch fresh (bypass cache)
    // Useful when debugging database function issues
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    retry: 1, // Only retry once on failure (default is 3)
    retryDelay: 1000, // Wait 1 second before retry
  });
};
