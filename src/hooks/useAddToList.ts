import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';
import { UserListStatus } from '../constants/userListStatus';

type AddToListParams = {
  userId: string;
  animeId: string;
  status: UserListStatus;
};

/**
 * Add anime to user's list with specified status.
 * Creates new user_lists entry or updates existing one.
 */
export const useAddToList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToListParams) => {
      const { userId, animeId, status } = params;

      console.log('[AddToList] Adding', { animeId, userId, status });

      const now = new Date().toISOString();
      const upsertData: any = {
        user_id: userId,
        anime_id: animeId,
        status,
        updated_at: now,
      };

      // Set initial episode for "Watching" status
      if (status === 'Watching') {
        upsertData.current_episode = 1;
        upsertData.started_at = now;
        upsertData.last_watched_at = now;
      }

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
    onSuccess: (_data, variables) => {
      // Invalidate list queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['continue-watching', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['my-list-active'] });
      queryClient.invalidateQueries({ queryKey: ['my-list-status'] });
    },
  });
};
