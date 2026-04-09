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
      console.log('[useRemoveFromList] Removing:', { userId, animeId });

      const { data, error, count } = await supabase
        .from('user_lists')
        .delete()
        .eq('user_id', userId)
        .eq('anime_id', animeId)
        .select();

      console.log('[useRemoveFromList] Result:', { rowsDeleted: data?.length, count, error });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.warn('[useRemoveFromList] ⚠️ Delete matched 0 rows — userId:', userId, 'animeId:', animeId);
        throw new Error(`No row found for userId=${userId} animeId=${animeId}`);
      }

      return { animeId };
    },

    onSuccess: (_, variables) => {
      HapticFeedback.trigger('notificationSuccess');

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
