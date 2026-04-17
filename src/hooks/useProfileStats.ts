import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';
import { getOrCreateDeviceUserId } from '../utils/deviceId';
import type { RewatchedAnime } from '../features/profile/components/MostRewatchedSection';

const DEMO_USER_ID = '1c16d367-73f0-478b-b434-aa3cce20981d';

const XP_PER_RATING = 10;
const XP_PER_LEVEL = 500;

export interface GenreStat {
  genre: string;
  count: number;
}

export interface ProfileStats {
  completedCount: number;
  episodesWatched: number;
  hoursWatched: number;
  avgScore: number | null;
  xpCurrent: number;
  xpToNext: number;
  genreBreakdown: GenreStat[];
  mostRewatched: RewatchedAnime[];
}

async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const deviceId = await getOrCreateDeviceUserId();

  // Run queries in parallel
  const [listsResult, ratingsResult, rewatchResult] = await Promise.all([
    supabase
      .from('user_lists')
      .select('anime:anime_id(tags, episodes_count)')
      .eq('user_id', userId)
      .eq('status', 'Completed'),
    supabase
      .from('ratings')
      .select('score_overall')
      .eq('device_user_id', deviceId)
      .not('score_overall', 'is', null),
    supabase
      .from('user_lists')
      .select('rewatch_count, anime:anime_id(id, title, thumbnail_url)')
      .eq('user_id', userId)
      .gt('rewatch_count', 0)
      .order('rewatch_count', { ascending: false })
      .limit(3),
  ]);

  if (listsResult.error) {
    console.warn('[useProfileStats] user_lists error:', listsResult.error.message);
    throw listsResult.error;
  }

  const rows = listsResult.data ?? [];
  const completedCount = rows.length;

  // Episodes watched = sum of episodes_count for completed anime
  let episodesWatched = 0;
  const tally = new Map<string, number>();

  for (const row of rows) {
    const anime = Array.isArray((row as any).anime) ? (row as any).anime[0] : (row as any).anime;
    if (!anime) continue;

    const eps: number = anime.episodes_count ?? 0;
    episodesWatched += eps;

    const rawTags = anime.tags ?? null;
    const tokens: string[] = [];
    const splitTokens = (s: string) =>
      s.split(/[;,|/]/g).map((t: string) => t.trim()).filter(Boolean);

    if (Array.isArray(rawTags)) {
      rawTags.forEach((item: unknown) => {
        const s = String(item ?? '').trim();
        if (!s) return;
        // Each array element may itself be a comma-joined string
        if (/[;,|/]/.test(s)) {
          tokens.push(...splitTokens(s));
        } else {
          tokens.push(s);
        }
      });
    } else if (typeof rawTags === 'string' && rawTags.length > 0) {
      const stripped = rawTags.replace(/^\{|\}$/g, '');
      tokens.push(...splitTokens(stripped));
    }

    for (const genre of tokens) {
      if (genre) tally.set(genre, (tally.get(genre) ?? 0) + 1);
    }
  }

  // Hours watched: average episode is 24 minutes
  const hoursWatched = Math.round((episodesWatched * 24) / 60);

  // Avg score from ratings
  const ratingRows = ratingsResult.data ?? [];
  let avgScore: number | null = null;
  if (ratingRows.length > 0) {
    const sum = ratingRows.reduce((acc, r) => acc + (r.score_overall ?? 0), 0);
    avgScore = Math.round((sum / ratingRows.length) * 10) / 10;
  }

  // XP: 10 per rating, level every 500 XP
  // DEV: 10× multiplier so small rating counts produce a visible bar fill
  const xpCurrent = ratingRows.length * XP_PER_RATING * (__DEV__ ? 10 : 1);
  const xpToNext = XP_PER_LEVEL - (xpCurrent % XP_PER_LEVEL);

  const genreBreakdown: GenreStat[] = Array.from(tally.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));

  const mostRewatched: RewatchedAnime[] = (rewatchResult.data ?? []).flatMap((row: any) => {
    const anime = Array.isArray(row.anime) ? row.anime[0] : row.anime;
    if (!anime) return [];
    return [{
      animeId: anime.id,
      title: anime.title ?? '',
      thumbnailUrl: anime.thumbnail_url ?? null,
      rewatchCount: row.rewatch_count,
    }];
  });

  return {
    completedCount,
    episodesWatched,
    hoursWatched,
    avgScore,
    xpCurrent,
    xpToNext,
    genreBreakdown,
    mostRewatched,
  };
}

export function useProfileStats(userId?: string) {
  const resolvedUserId = userId ?? DEMO_USER_ID;

  return useQuery<ProfileStats>({
    queryKey: ['profile-stats', resolvedUserId],
    queryFn: () => fetchProfileStats(resolvedUserId),
    staleTime: 5 * 60 * 1000,
  });
}
