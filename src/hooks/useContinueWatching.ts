import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

interface ContinueWatchingItem {
  id: string;
  anime_id: string;
  status: 'watching' | 'rewatching';
  current_episode: number;
  total_episodes: number | null;
  last_watched_at: string;
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    series_id: string | null;
    season_number: number | null;
    episodes_count: number | null;
    has_specials: boolean;
    series: {
      title: string;
    } | null;
  };
}

interface UseContinueWatchingOptions {
  limit?: number; // undefined = no limit (show all)
  userId?: string; // Optional userId override
}

export const useContinueWatching = (options?: UseContinueWatchingOptions) => {
  const { limit, userId } = options || {};

  return useQuery({
    queryKey: ['continue-watching', userId, limit],
    queryFn: async () => {
      if (!userId) {
        console.log('[useContinueWatching] No userId provided, returning empty array');
        return [];
      }

      console.log(`[useContinueWatching] Fetching continue watching (limit: ${limit || 'all'})`);

      let query = supabase
        .from('user_lists')
        .select(`
          id,
          anime_id,
          status,
          current_episode,
          total_episodes,
          last_watched_at,
          anime:anime_id (
            id,
            title,
            thumbnail_url,
            series_id,
            season_number,
            episodes_count,
            has_specials
          )
        `)
        .eq('user_id', userId)
        .in('status', ['watching', 'rewatching'])
        .order('last_watched_at', { ascending: false });

      // Apply limit if specified (for Home tab)
      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useContinueWatching] Error:', error);
        throw error;
      }

      console.log(`[useContinueWatching] Fetched ${data?.length || 0} items`);
      return (data as ContinueWatchingItem[]) || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
