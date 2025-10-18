import { supabase } from '../../../db/supabaseClient';
import { getOrCreateDeviceUserId } from '../../../utils/deviceId';

export type RatingRow = {
  user_id: string;
  anime_id: string;
  score_overall: number | null;
  is_eleven_out_of_ten: boolean | null;
};

export async function getMyRating(anime_id: string) {
  const user_id = await getOrCreateDeviceUserId();
  const { data, error } = await supabase
    .from('ratings')
    .select('user_id, anime_id, score_overall, is_eleven_out_of_ten')
    .eq('user_id', user_id)
    .eq('anime_id', anime_id)
    .maybeSingle();
  if (error) throw error;
  return data as RatingRow | null;
}

export async function upsertMyRating(params: { anime_id: string; score_overall: number; is_eleven_out_of_ten?: boolean }) {
  const user_id = await getOrCreateDeviceUserId();
  const payload = {
    user_id,
    anime_id: params.anime_id,
    score_overall: params.score_overall,
    is_eleven_out_of_ten: !!params.is_eleven_out_of_ten,
  };
  const { data, error } = await supabase
    .from('ratings')
    .upsert(payload, { onConflict: 'user_id,anime_id' })
    .select('user_id, anime_id, score_overall, is_eleven_out_of_ten')
    .single();
  if (error) throw error;
  return data as RatingRow;
}
