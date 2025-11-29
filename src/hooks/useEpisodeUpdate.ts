import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';
import HapticFeedback from 'react-native-haptic-feedback';

interface UpdateEpisodeParams {
  userListId: string;
  animeId: string;
  newEpisode: number;
  currentEpisode: number;
  totalEpisodes: number | null;
  userId: string;
}

export const useEpisodeUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userListId,
      animeId,
      newEpisode,
      totalEpisodes,
      userId,
    }: UpdateEpisodeParams) => {
      console.log('[useEpisodeUpdate] Updating to episode:', newEpisode);

      // Check if series is complete
      const isComplete = !!totalEpisodes && newEpisode >= totalEpisodes;

      // Update episode progress
      const updateData: any = {
        current_episode: newEpisode,
        last_watched_at: new Date().toISOString(),
      };

      // If complete, update status and completion date
      if (isComplete) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();

        // If this is first completion, set original_completed_at
        const { data: existing } = await supabase
          .from('user_lists')
          .select('original_completed_at')
          .eq('id', userListId)
          .single();

        if (!existing?.original_completed_at) {
          updateData.original_completed_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('user_lists')
        .update(updateData)
        .eq('id', userListId)
        .select()
        .single();

      if (error) {
        console.error('[useEpisodeUpdate] Error:', error);
        throw error;
      }

      console.log('[useEpisodeUpdate] Updated successfully:', data);

      return {
        ...data,
        isComplete,
      };
    },

    onSuccess: (data, variables) => {
      // Haptic feedback
      if (data.isComplete) {
        HapticFeedback.trigger('notificationSuccess');
      } else {
        HapticFeedback.trigger('impactLight');
      }

      // Invalidate continue watching queries
      queryClient.invalidateQueries({
        queryKey: ['continue-watching', variables.userId]
      });

      console.log('[useEpisodeUpdate] Episode updated successfully');
    },

    onError: (error) => {
      console.error('[useEpisodeUpdate] Mutation error:', error);
      HapticFeedback.trigger('notificationError');
    },
  });
};
