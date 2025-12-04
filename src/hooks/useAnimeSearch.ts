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

      console.log('[useAnimeSearch] Smart search for:', debouncedQuery);

      // Call the hybrid search function
      const { data, error } = await supabase
        .rpc('search_anime', { search_term: debouncedQuery });

      if (error) {
        console.error('[useAnimeSearch] Error:', error);
        throw error;
      }

      console.log('[useAnimeSearch] Found', data?.length || 0, 'results');

      // Log first result for debugging
      if (data && data.length > 0) {
        console.log('[useAnimeSearch] Top result:', data[0].title);
      }

      return data || [];
    },
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
