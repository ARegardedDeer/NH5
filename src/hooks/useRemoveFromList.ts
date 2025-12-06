import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';
import HapticFeedback from 'react-native-haptic-feedback';

interface RemoveFromListParams {
  userId: string;
  animeId: string;
}

export const useRemoveFromList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, animeId }: RemoveFromListParams) => {
      console.log('[useRemoveFromList] Removing anime:', animeId);

      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('user_id', userId)
        .eq('anime_id', animeId);

      if (error) throw error;

      return { animeId };
    },

    onSuccess: (_, variables) => {
      HapticFeedback.trigger('notificationSuccess');

      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: ['my-list-active', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['my-list-status', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching', variables.userId] });

      console.log('[useRemoveFromList] ✅ Removed from list');
    },

    onError: (error) => {
      console.error('[useRemoveFromList] ❌ Error:', error);
      HapticFeedback.trigger('notificationError');
    },
  });
};
