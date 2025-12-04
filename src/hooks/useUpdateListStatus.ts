import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';
import { assertUserListStatus, UserListStatus } from '../constants/userListStatus';

type UpdateStatusParams = {
  userId: string;
  animeId: string;
  newStatus: UserListStatus;
  overrideCompletedAt?: string | null;
  overrideOriginalCompletedAt?: string | null;
  overrideLastWatchedAt?: string | null;
  forceLastWatchedNow?: boolean;
  ensureCurrentEpisodeMin1?: boolean;
  ensureStartedNow?: boolean;
};

/**
 * Update user_lists status with optional timestamp overrides (used for undo).
 */
export const useUpdateListStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateStatusParams) => {
      const {
        userId,
        animeId,
        newStatus,
        overrideCompletedAt,
        overrideOriginalCompletedAt,
        overrideLastWatchedAt,
      } = params;

      assertUserListStatus(newStatus);
      console.log('[MyListStatus] updating', { animeId, userId, nextStatus: newStatus, payload: params });

      const now = new Date().toISOString();
      const updateData: any = {
        status: newStatus,
        updated_at: now,
      };

      // Apply overrides (for undo) first
      if (overrideCompletedAt !== undefined) updateData.completed_at = overrideCompletedAt;
      if (overrideOriginalCompletedAt !== undefined) {
        updateData.original_completed_at = overrideOriginalCompletedAt;
      }
      if (overrideLastWatchedAt !== undefined) updateData.last_watched_at = overrideLastWatchedAt;

      if (params.forceLastWatchedNow && overrideLastWatchedAt === undefined) {
        updateData.last_watched_at = now;
      }

      if (params.ensureStartedNow) {
        updateData.started_at = now;
      }

      if (params.ensureCurrentEpisodeMin1) {
        updateData.current_episode = 1;
      }

      // If no overrides and setting Completed, set completion timestamps
      if (newStatus === 'Completed' && overrideCompletedAt === undefined) {
        updateData.completed_at = now;

        // Preserve first completion if missing
        const { data: existing } = await supabase
          .from('user_lists')
          .select('original_completed_at')
          .eq('user_id', userId)
          .eq('anime_id', animeId)
          .single();

        if (overrideOriginalCompletedAt === undefined) {
          if (!existing?.original_completed_at) {
            updateData.original_completed_at = now;
          }
        }

        if (overrideLastWatchedAt === undefined) {
          updateData.last_watched_at = now;
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
        console.error('[MyListSwipe] Update error raw:', error);
        let friendly = 'Request failed. Please try again.';
        if ((error as any)?.code === '23514') {
          friendly =
            "Can’t move item: status value isn’t allowed by the database. (Have you applied the latest migration?)";
        } else if ((error as any)?.code) {
          friendly = `Request failed (code ${(error as any).code}). Please try again.`;
        }
        const context = `status=${newStatus}, animeId=${animeId}, userId=${userId}`;
        throw new Error(`[MyListStatus] ${friendly} (${context})`);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate list + continue watching
      queryClient.invalidateQueries({ queryKey: ['continue-watching', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['my-list-active'] });
      queryClient.invalidateQueries({ queryKey: ['my-list-status'] });
    },
  });
};
