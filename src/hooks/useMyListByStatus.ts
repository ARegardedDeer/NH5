import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

type OrderRule = { column: string; ascending?: boolean; nullsFirst?: boolean };

interface UseMyListByStatusOptions {
  userId?: string;
  statuses: string[];
  order?: OrderRule[];
  enabled?: boolean;
}

export const useMyListByStatus = ({
  userId,
  statuses,
  order = [],
  enabled = true,
}: UseMyListByStatusOptions) => {
  return useQuery({
    queryKey: ['my-list-status', userId, statuses, order],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useMyListByStatus] Fetching list', { userId, statuses, order });

      let query = supabase
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
        .in('status', statuses);

      order.forEach((rule) => {
        query = query.order(rule.column, {
          ascending: rule.ascending ?? false,
          nullsFirst: rule.nullsFirst ?? false,
        });
      });

      const { data, error } = await query;

      if (error) {
        console.error('[useMyListByStatus] Query error:', error);
        throw error;
      }

      const transformed = (data || []).map((item: any) => ({
        ...item,
        anime: Array.isArray(item.anime) ? item.anime[0] : item.anime,
      }));

      if (__DEV__) {
        console.log('[useMyListByStatus] Fetched', transformed.length, 'items for', statuses.join(', '));
      }

      return transformed;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
