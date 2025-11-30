import { supabase } from '../db/supabaseClient';

export type ListStatus = 'watching' | 'plan_to_watch' | 'completed' | 'on_hold' | 'dropped' | 'rewatching';

/**
 * Convert UI status labels to database status values
 * Maps "Watching" → "watching", "Plan to Watch" → "plan_to_watch", etc.
 */
export function normalizeStatusToDb(uiStatus: string | null): ListStatus | null {
  if (!uiStatus) return null;

  const normalized = uiStatus.trim().toLowerCase().replace(/\s+/g, '_');

  const statusMap: Record<string, ListStatus> = {
    'watching': 'watching',
    'plan_to_watch': 'plan_to_watch',
    'completed': 'completed',
    'on_hold': 'on_hold',
    'dropped': 'dropped',
    'rewatching': 'rewatching',
  };

  return statusMap[normalized] || null;
}

interface AddToListParams {
  userId: string;
  animeId: string;
  status: ListStatus | null;
  bookmarked?: boolean;
  episodesCount?: number | null;
  currentEpisode?: number;
}

/**
 * Build user_lists row data with proper episode tracking columns
 * based on the status being set.
 */
export function buildListItemData(params: AddToListParams) {
  const { userId, animeId, status, bookmarked = false, episodesCount, currentEpisode } = params;

  const baseData = {
    user_id: userId,
    anime_id: animeId,
    status,
    bookmarked,
    updated_at: new Date().toISOString(),
  };

  const now = new Date().toISOString();

  switch (status) {
    case 'watching':
      return {
        ...baseData,
        current_episode: currentEpisode ?? 1,
        total_episodes: episodesCount ?? null,
        started_at: now,
        last_watched_at: now,
      };

    case 'rewatching':
      return {
        ...baseData,
        current_episode: currentEpisode ?? 1,
        total_episodes: episodesCount ?? null,
        started_at: now,
        last_watched_at: now,
      };

    case 'plan_to_watch':
      return {
        ...baseData,
        current_episode: 0,
        total_episodes: episodesCount ?? null,
        started_at: null,
        last_watched_at: null,
      };

    case 'completed':
      return {
        ...baseData,
        current_episode: episodesCount ?? 0,
        total_episodes: episodesCount ?? null,
        completed_at: now,
        original_completed_at: now,
        last_watched_at: now,
      };

    case 'on_hold':
    case 'dropped':
      // Preserve existing current_episode (don't reset)
      return {
        ...baseData,
        // Keep existing current_episode - only update timestamp
        last_watched_at: now,
      };

    default:
      return baseData;
  }
}

/**
 * Add or update anime in user's list with proper episode tracking.
 * Fetches episodes_count from anime table if not provided.
 */
export async function addToList(params: AddToListParams): Promise<{ ok: boolean; error?: any }> {
  try {
    let episodesCount = params.episodesCount;

    // Fetch episodes_count if not provided
    if (episodesCount === undefined) {
      const { data: anime, error: fetchError } = await supabase
        .from('anime')
        .select('episodes_count')
        .eq('id', params.animeId)
        .single();

      if (fetchError) {
        console.error('[listHelpers] Error fetching anime:', fetchError);
        return { ok: false, error: fetchError };
      }

      episodesCount = anime?.episodes_count ?? null;
    }

    const data = buildListItemData({ ...params, episodesCount });

    const { error } = await supabase
      .from('user_lists')
      .upsert(data, { onConflict: 'user_id,anime_id' });

    if (error) {
      console.error('[listHelpers] Error upserting user_list:', error);
      return { ok: false, error };
    }

    console.log('[listHelpers] Added to list:', {
      animeId: params.animeId,
      status: params.status,
      episodesCount,
    });

    return { ok: true };
  } catch (err) {
    console.error('[listHelpers] Unexpected error:', err);
    return { ok: false, error: err };
  }
}
