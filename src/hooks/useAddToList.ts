import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';
import { UserListStatus } from '../constants/userListStatus';
import HapticFeedback from 'react-native-haptic-feedback';

type AddToListParams = {
  userId: string;
  animeId: string;
  status: UserListStatus;
  episodesCount?: number | null;
};

/**
 * Add anime to user's list with specified status.
 * Creates new user_lists entry or updates existing one.
 */
export const useAddToList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToListParams) => {
      const { userId, animeId, status, episodesCount } = params;

      console.log('[AddToList] Adding', { animeId, userId, status, episodesCount });

      // If episodes_count not provided, fetch from database
      let totalEpisodes = episodesCount;

      if (totalEpisodes === undefined) {
        const { data: anime, error: animeError } = await supabase
          .from('anime')
          .select('episodes_count')
          .eq('id', animeId)
          .single();

        if (animeError) throw animeError;
        totalEpisodes = anime?.episodes_count || null;
      }

      const now = new Date().toISOString();
      const isWatching = status === 'Watching';

      const upsertData: any = {
        user_id: userId,
        anime_id: animeId,
        status,
        current_episode: isWatching ? 1 : 0,
        total_episodes: totalEpisodes,
        started_at: isWatching ? now : null,
        last_watched_at: isWatching ? now : null,
        created_at: now,
        updated_at: now,
      };

      // Upsert (insert or update)
      const { data, error } = await supabase
        .from('user_lists')
        .upsert(upsertData, {
          onConflict: 'user_id,anime_id',
        })
        .select()
        .single();

      if (error) {
        console.error('[AddToList] Error:', error);
        throw new Error(`Failed to add anime to list: ${error.message}`);
      }

      return data;
    },

    onSuccess: (_, variables) => {
      HapticFeedback.trigger('notificationSuccess');

      // Invalidate list queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['continue-watching', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['my-list-active'] });
      queryClient.invalidateQueries({ queryKey: ['my-list-status'] });

      console.log('[AddToList] ✅ Successfully added to', variables.status);
    },

    onError: (error) => {
      console.error('[AddToList] ❌ Error:', error);
      HapticFeedback.trigger('notificationError');
    },
  });
};
