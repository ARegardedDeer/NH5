import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';
import HapticFeedback from 'react-native-haptic-feedback';

interface UpdateEpisodeParams {
  animeId: string;
  newEpisode: number;
  currentEpisode: number;
  totalEpisodes: number | null;
  userId: string;
  currentStatus?: string;
}

export const useEpisodeUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animeId,
      newEpisode,
      totalEpisodes,
      userId,
      currentStatus,
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
        updateData.status = 'Completed';
        updateData.completed_at = new Date().toISOString();

        // If completing from Rewatching, increment rewatch_count
        if (currentStatus === 'Rewatching') {
          const { data: existing } = await supabase
            .from('user_lists')
            .select('rewatch_count, original_completed_at')
            .eq('user_id', userId)
            .eq('anime_id', animeId)
            .single();
          updateData.rewatch_count = ((existing?.rewatch_count ?? 0) as number) + 1;
          if (!existing?.original_completed_at) {
            updateData.original_completed_at = new Date().toISOString();
          }
        } else {
          // First completion: set original_completed_at if missing
          const { data: existing } = await supabase
            .from('user_lists')
            .select('original_completed_at')
            .eq('user_id', userId)
            .eq('anime_id', animeId)
            .single();
          if (!existing?.original_completed_at) {
            updateData.original_completed_at = new Date().toISOString();
          }
        }
      }

      const { data, error } = await supabase
        .from('user_lists')
        .update(updateData)
        .eq('user_id', userId)
        .eq('anime_id', animeId)
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
      // Invalidate my list queries (active + status-based)
      queryClient.invalidateQueries({ queryKey: ['my-list-active'] });
      queryClient.invalidateQueries({ queryKey: ['my-list-status'] });

      console.log('[useEpisodeUpdate] Episode updated successfully');
    },

    onError: (error) => {
      console.error('[useEpisodeUpdate] Mutation error:', error);
      HapticFeedback.trigger('notificationError');
    },
  });
};
