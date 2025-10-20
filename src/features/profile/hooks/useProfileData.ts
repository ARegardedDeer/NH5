import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../db/supabaseClient';

const DEMO_USER_ID = '1c16d367-73f0-478b-b434-aa3cce20981d';
const CACHE_KEY = 'nh5_demo_user::profile-hook-cache';
const CACHE_TTL_MS = 10 * 60 * 1000;

type SocialLinks = {
  youtube: string | null;
  twitch: string | null;
  x: string | null;
};

type ProfileBasics = {
  handle: string | null;
  bio: string | null;
  socials: SocialLinks;
  showSocials: boolean;
  user_id: string | null;
  avatar_url: string | null;
};

export type ProfileBadge = {
  badgeId: string;
  id: string;
  isShowcased: boolean;
  unlockedAt: string | null;
  name?: string | null;
};

export type TopListEntry = {
  position: number;
  id: string;
  anime_id: string;
  title: string;
  thumbnailUrl: string | null;
  thumbnail_url: string | null;
  note?: string | null;
};

export type ElevenAnime = {
  id: string;
  title: string;
  thumbnail_url: string | null;
} | null;

export type GridNineItem = {
  id: string;
  title: string;
  thumbnail_url: string | null;
};

export type HookResult = {
  profile: ProfileBasics;
  badges: ProfileBadge[];
  topList: TopListEntry[];
  eleven: ElevenAnime;
  banner: ElevenAnime;
  gridNine: GridNineItem[];
  demoUserId: string;
  error?: string;
};

const EMPTY_SOCIALS: SocialLinks = { youtube: null, twitch: null, x: null };

const createEmptyProfile = (): ProfileBasics => ({
  handle: null,
  bio: null,
  socials: { ...EMPTY_SOCIALS },
  showSocials: false,
  user_id: null,
  avatar_url: null,
});

async function getCachedUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { id?: string; ts?: number };
    if (!parsed?.id) {
      return null;
    }
    if (Date.now() - (parsed.ts ?? 0) > CACHE_TTL_MS) {
      return null;
    }
    return parsed.id;
  } catch (err) {
    console.warn('[profile] cache read error:', err);
    return null;
  }
}

async function setCachedUserId(id: string) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ id, ts: Date.now() }));
  } catch (err) {
    console.warn('[profile] cache write error:', err);
  }
}

async function resolveUserId(): Promise<string> {
  const cached = await getCachedUserId();
  if (cached) {
    return cached;
  }
  await setCachedUserId(DEMO_USER_ID);
  return DEMO_USER_ID;
}

async function fetchProfileBasics(userId: string): Promise<{ profile: ProfileBasics; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('handle,bio,twitch,x,youtube,show_socials')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[profile] fetchProfileBasics error', error.message);
      return {
        profile: createEmptyProfile(),
        error: error.message,
      };
    }

    const showSocials = Boolean(data?.show_socials);

    let socials: SocialLinks = { ...EMPTY_SOCIALS };
    if (showSocials) {
      socials = {
        youtube: data?.youtube ?? null,
        twitch: data?.twitch ?? null,
        x: data?.x ?? null,
      };

      if (Object.values(socials).some((value) => Boolean(value))) {
        console.log('[profile] fetchSocials ok', socials);
      }
    } else {
      console.log('[profile] fetchSocials skipped');
    }

    const profile: ProfileBasics = {
      handle: data?.handle ?? null,
      bio: data?.bio ?? null,
      socials,
      showSocials,
      user_id: userId ?? null,
      avatar_url: (data as any)?.avatar_url ?? null,
    };

    console.log('[profile] fetchProfileBasics ok', profile);

    return { profile };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.warn('[profile] fetchProfileBasics error', message);
    return {
      profile: createEmptyProfile(),
      error: message,
    };
  }
}

async function fetchBadges(userId: string): Promise<{ badges: ProfileBadge[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id,is_showcased,unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.warn('[profile] fetchBadges error', error.message);
      return { badges: [], error: error.message };
    }

    const badges = (data ?? [])
      .map((row: any) => {
        const badgeId = row?.badge_id;
        if (!badgeId) {
          return null;
        }
        return {
          badgeId,
          id: badgeId,
          isShowcased: Boolean(row?.is_showcased),
          unlockedAt: row?.unlocked_at ?? null,
          name: null,
        } as ProfileBadge;
      })
      .filter(Boolean) as ProfileBadge[];

    console.log('[profile] fetchBadges ok', { count: badges.length });

    return { badges };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.warn('[profile] fetchBadges error', message);
    return { badges: [], error: message };
  }
}
async function fetchTopList(userId: string): Promise<{ topList: TopListEntry[]; error?: string }> {
  try {
    void userId;
    const { data, error } = await supabase
      .from('anime')
      .select('id,title,thumbnail_url')
      .order('title', { ascending: true })
      .limit(10);

    if (error) {
      console.warn('[profile] fetchTopList error', error.message);
      return { topList: [], error: error.message };
    }

    const rows = Array.isArray(data) ? data : [];
    const topList = rows
      .map((row: any, index: number) => {
        const animeId = typeof row?.id === 'string' ? row.id : null;
        if (!animeId) {
          return null;
        }
        const title = typeof row?.title === 'string' ? row.title : '';
        const thumbnail = typeof row?.thumbnail_url === 'string' ? row.thumbnail_url : null;
        return {
          position: index + 1,
          id: animeId,
          anime_id: animeId,
          title,
          thumbnailUrl: thumbnail,
          thumbnail_url: thumbnail,
          note: null,
        } as TopListEntry;
      })
      .filter(Boolean) as TopListEntry[];

    console.log('[profile] fetchTopList ok', { count: topList.length });
    if (topList.length > 0) {
      console.log('[profile] fetchTopList sample', topList.slice(0, 3));
    }

    return { topList };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.warn('[profile] fetchTopList error', message);
    return { topList: [], error: message };
  }
}

async function fetchEleven(userId: string): Promise<ElevenAnime> {
  try {
    // Step 1: get anime_id
    const { data: row, error: rowErr } = await supabase
      .from('user_eleven')
      .select('anime_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (rowErr) throw rowErr;
    if (!row?.anime_id) {
      console.log('[profile] fetchEleven ok', null);
      return null;
    }

    // Step 2: get anime data
    const { data: anime, error: animeErr } = await supabase
      .from('anime')
      .select('id, title, thumbnail_url')
      .eq('id', row.anime_id)
      .maybeSingle();

    if (animeErr) throw animeErr;

    console.log('[profile] fetchEleven ok', anime);
    return anime ?? null;
  } catch (err) {
    console.warn('[profile] fetchEleven error', err);
    return null;
  }
}

async function loadProfileData(): Promise<HookResult> {
  const errors: string[] = [];

  const userId = await resolveUserId().catch((err: any) => {
    const message = err?.message ?? String(err);
    errors.push(`resolveUserId: ${message}`);
    return DEMO_USER_ID;
  });

  const [{ profile, error: profileErr }, { badges, error: badgesErr }, { topList, error: topListErr }] =
    await Promise.all([fetchProfileBasics(userId), fetchBadges(userId), fetchTopList(userId)]);

  if (profileErr) errors.push(`profile: ${profileErr}`);
  if (badgesErr) errors.push(`badges: ${badgesErr}`);
  if (topListErr) errors.push(`topList: ${topListErr}`);

  const eleven = await fetchEleven(userId);

  async function fetchBanner(userId: string) {
    try {
      // read banner_anime_id from user_profiles
      const { data: prof, error: pe } = await supabase
        .from('user_profiles')
        .select('banner_anime_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (pe) throw pe;

      const bannerId = prof?.banner_anime_id;
      // default to eleven if no explicit banner
      const chosenId = bannerId || eleven?.id || null;
      if (!chosenId) return null;

      const { data: a, error: ae } = await supabase
        .from('anime')
        .select('id,title,thumbnail_url')
        .eq('id', chosenId)
        .maybeSingle();
      if (ae) throw ae;

      console.log('[profile] fetchBanner ok', a || null);
      return a || null;
    } catch (e) {
      console.log('[profile] fetchBanner error', e);
      return null;
    }
  }

  const banner = await fetchBanner(userId);

  // Build 3x3 grid from topList
  const gridNine = (topList || []).slice(0, 9).map((x) => ({
    id: x.anime_id,
    title: x.title,
    thumbnail_url: x.thumbnail_url ?? null,
  }));

  const error = errors.length ? errors.join(' | ') : undefined;

  console.log('[profile] userId:', userId);
  console.log('[profile] topList(count):', topList?.length ?? 0);
  console.log('[profile] fetchProfileBasics ok', profile);
  console.log('[profile] fetchBadges ok', badges);
  console.log('[profile] eleven:', eleven);

  return {
    profile,
    badges,
    topList,
    eleven,
    banner,
    gridNine,
    demoUserId: DEMO_USER_ID,
    error,
  };
}

export function useProfileData() {
  const query = useQuery<HookResult>({
    queryKey: ['profile', 'demo'],
    queryFn: loadProfileData,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (query.data?.error) {
      console.warn('[profile] aggregated error:', query.data.error);
    }
  }, [query.data?.error]);

  return query;
}

export default useProfileData;
