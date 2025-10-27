import { supabase } from '../../db/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV = __DEV__;

export function normalizeScore(num: number): number {
  if (num === 11) return 11;
  const clamped = Math.max(1, Math.min(10, num));
  return Math.round(clamped * 10) / 10;
}

export async function readUserRating({ uid, animeId }: { uid: string; animeId: string }): Promise<number | null> {
  try {
    const { data: row, error } = await supabase
      .from('ratings')
      .select('score_overall')
      .eq('user_id', uid)
      .eq('anime_id', animeId)
      .maybeSingle();

    if (error) {
      const code = (error as any)?.code;
      if (code === '42P01' || code === '42703') {
        // Fallback to AsyncStorage (v2)
        const key = `nh5::user_rating::${animeId}::v2`;
        const cached = await AsyncStorage.getItem(key);
        if (DEV) console.log('[ratings] io: read fallback cache', { animeId, cached: !!cached });
        return cached ? parseFloat(cached) : null;
      }
      throw error;
    }

    return typeof row?.score_overall === 'number' ? row.score_overall : null;
  } catch (err: any) {
    if (DEV) console.warn('[ratings] io: read error:', err?.message ?? err);
    return null;
  }
}

export async function upsertUserRating({
  uid,
  animeId,
  score,
}: {
  uid: string;
  animeId: string;
  score: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ratings')
      .upsert(
        { user_id: uid, anime_id: animeId, score_overall: score },
        { onConflict: 'user_id,anime_id' }
      );

    if (error) {
      const code = (error as any)?.code;
      if (code === '42P01' || code === '42703') {
        // Fallback to AsyncStorage (v2)
        const key = `nh5::user_rating::${animeId}::v2`;
        await AsyncStorage.setItem(key, score.toString());
        if (DEV) console.log('[ratings] io: upsert fallback cache', { animeId, score });
        return { ok: true };
      }
      return { ok: false, error: error.message || error.code || 'unknown' };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'unknown' };
  }
}

export async function deleteUserRating({
  uid,
  animeId,
}: {
  uid: string;
  animeId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('user_id', uid)
      .eq('anime_id', animeId);

    if (error) {
      const code = (error as any)?.code;
      if (code === '42P01' || code === '42703') {
        // Fallback to AsyncStorage (v2)
        const key = `nh5::user_rating::${animeId}::v2`;
        await AsyncStorage.removeItem(key);
        if (DEV) console.log('[ratings] io: delete fallback cache', { animeId });
        return { ok: true };
      }
      return { ok: false, error: error.message || error.code || 'unknown' };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'unknown' };
  }
}

export async function setElevenFlag({
  uid,
  animeId,
  enabled,
}: {
  uid: string;
  animeId: string;
  enabled: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (enabled) {
      const { error } = await supabase
        .from('user_eleven')
        .upsert({ user_id: uid, anime_id: animeId }, { onConflict: 'user_id' });

      if (error) {
        return { ok: false, error: error.message || error.code || 'unknown' };
      }
    } else {
      const { error } = await supabase
        .from('user_eleven')
        .delete()
        .eq('user_id', uid);

      if (error) {
        return { ok: false, error: error.message || error.code || 'unknown' };
      }
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'unknown' };
  }
}
