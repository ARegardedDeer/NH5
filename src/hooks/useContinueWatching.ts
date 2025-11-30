import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

interface ContinueWatchingItem {
  user_id: string;
  anime_id: string;
  status: 'Watching' | 'Rewatching';
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
        console.log('[useContinueWatching] ❌ No userId provided, returning empty array');
        return [];
      }

      console.log('[useContinueWatching] 🔄 START QUERY');
      console.log('[useContinueWatching] userId:', userId);
      console.log('[useContinueWatching] limit:', limit || 'all');

      let query = supabase
        .from('user_lists')
        .select(`
          user_id,
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
        .in('status', ['Watching', 'Rewatching'])
        .order('last_watched_at', { ascending: false, nullsFirst: false });

      // Apply limit if specified (for Home tab)
      if (limit !== undefined) {
        query = query.limit(limit);
      }

      console.log('[useContinueWatching] 📡 Executing Supabase query...');

      const { data, error } = await query;

      console.log('[useContinueWatching] 📊 Query response:', {
        dataLength: data?.length,
        hasError: !!error,
      });

      if (error) {
        console.error('[useContinueWatching] ❌ Query error:', error);
        console.error('[useContinueWatching] ❌ Error message:', error?.message);
        console.error('[useContinueWatching] ❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[useContinueWatching] ✅ Raw data sample:', data?.[0] ? JSON.stringify(data[0], null, 2) : 'No data');
      console.log(`[useContinueWatching] Fetched ${data?.length || 0} items`);

      // Transform the data to ensure anime is an object, not an array
      const transformedData = (data || []).map((item: any) => {
        const anime = Array.isArray(item.anime) ? item.anime[0] : item.anime;
        console.log('[useContinueWatching] 🔄 Transforming item:', {
          animeId: item.anime_id,
          animeIsArray: Array.isArray(item.anime),
          animeTitle: anime?.title,
        });
        return {
          ...item,
          anime,
        };
      });

      console.log('[useContinueWatching] ✅ Transformed data length:', transformedData.length);

      return transformedData as ContinueWatchingItem[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
