import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

interface UseActiveAnimeOptions {
  userId: string | undefined;
  enabled?: boolean;
}

export const useActiveAnime = ({ userId, enabled = true }: UseActiveAnimeOptions) => {
  return useQuery({
    queryKey: ['my-list-active', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useActiveAnime] Fetching active anime for user:', userId);

      const { data, error } = await supabase
        .from('user_lists')
        .select(`
          *,
          anime:anime_id (
            id,
            title,
            thumbnail_url,
            episodes_count,
            has_specials,
            series_id,
            season_number,
            series:series_id (
              title
            )
          )
        `)
        .eq('user_id', userId)
        .in('status', ['Watching', 'Rewatching'])
        .order('last_watched_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[useActiveAnime] Query error:', error);
        throw error;
      }

      console.log('[useActiveAnime] Fetched', data?.length || 0, 'items');

      // Transform data to ensure anime is an object
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        anime: Array.isArray(item.anime) ? item.anime[0] : item.anime,
      }));

      return transformedData;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
