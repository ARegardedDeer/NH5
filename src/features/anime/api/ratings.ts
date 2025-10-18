import { supabase } from '../../../db/supabaseClient';
import { getOrCreateDeviceUserId } from '../../../utils/deviceId';

type IdentityColumns = 'user_id' | 'device_user_id';

export type RatingRow = {
  anime_id: string;
  score_overall: number | null;
  is_eleven_out_of_ten: boolean | null;
  user_id?: string | null;
  device_user_id?: string | null;
};

async function resolveIdentity(): Promise<{
  column: IdentityColumns;
  value: string;
  isUser: boolean;
}> {
  // FUTURE: replace null with auth user id when session support is added.
  const authedUserId: string | null = null;
  if (authedUserId) {
    return { column: 'user_id', value: authedUserId, isUser: true };
  }
  const deviceId = await getOrCreateDeviceUserId();
  return { column: 'device_user_id', value: deviceId, isUser: false };
}

export async function getMyRating(anime_id: string) {
  const identity = await resolveIdentity();
  const { data, error } = await supabase
    .from('ratings')
    .select('user_id, device_user_id, anime_id, score_overall, is_eleven_out_of_ten')
    .eq(identity.column, identity.value)
    .eq('anime_id', anime_id)
    .maybeSingle();
  if (error) throw error;
  return (data as RatingRow | null) ?? null;
}

export async function upsertMyRating(params: {
  anime_id: string;
  score_overall: number;
  is_eleven_out_of_ten?: boolean;
}) {
  const identity = await resolveIdentity();
  const payload: RatingRow & Record<IdentityColumns, string | null> = {
    anime_id: params.anime_id,
    score_overall: params.score_overall,
    is_eleven_out_of_ten: !!params.is_eleven_out_of_ten,
    user_id: identity.isUser ? identity.value : null,
    device_user_id: identity.isUser ? null : identity.value,
  };

  const { data, error } = await supabase
    .from('ratings')
    .upsert(payload, { onConflict: `${identity.column},anime_id` })
    .select('user_id, device_user_id, anime_id, score_overall, is_eleven_out_of_ten')
    .single();
  if (error) throw error;
  return data as RatingRow;
}
