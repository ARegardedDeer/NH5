import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

interface AnimeSearchResult {
  id: string;
  title: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  synopsis: string | null;
  episodes_count: number | null;
}

export const useAnimeSearch = (query: string, options?: { enabled?: boolean }) => {
  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= 2;

  return useQuery({
    queryKey: ['anime-search', trimmedQuery],
    queryFn: async () => {
      if (!shouldSearch) {
        return [];
      }

      console.log('[anime-search] Searching for:', trimmedQuery);

      // Search anime by title (case-insensitive partial match)
      const { data, error } = await supabase
        .from('anime')
        .select('id, title, thumbnail_url, tags, synopsis, episodes_count')
        .ilike('title', `%${trimmedQuery}%`)
        .not('thumbnail_url', 'is', null) // Prefer anime with images
        .limit(20)
        .order('title', { ascending: true });

      if (error) {
        console.error('[anime-search] Error:', error);
        throw error;
      }

      console.log('[anime-search] Found', data?.length || 0, 'results');
      return (data || []) as AnimeSearchResult[];
    },
    enabled: shouldSearch && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
