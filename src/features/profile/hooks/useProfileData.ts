import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import supabase from '../../../db/supabaseClient';
import { getCurrentUserId } from '../../../state/currentUser';

export interface ProfileUser {
  id: string;
  username: string;
  handle?: string | null;
  avatar_url?: string | null;
  level?: number | null;
  exp?: number | null;
  bio?: string | null;
  show_level?: boolean;
  show_socials?: boolean;
}

export interface ProfileDetails {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  show_socials?: boolean;
  social_youtube?: string | null;
  social_twitch?: string | null;
  social_x?: string | null;
}

export interface ProfileBadge {
  id: string;
  slug: string;
  name: string;
  tier?: number | null;
  type?: string | null;
}

export interface ElevenHighlight {
  title?: string;
  thumbnail_url?: string | null;
  anime?: {
    id?: string;
    title?: string;
    thumbnail_url?: string | null;
    tags?: string[] | null;
  };
}

export interface TopListEntry {
  position: number;
  title?: string;
  thumbnail_url?: string | null;
  note?: string | null;
  anime?: {
    id?: string;
    title?: string;
    thumbnail_url?: string | null;
  };
}

export interface SocialLink {
  platform: 'youtube' | 'twitch' | 'twitter';
  url: string;
}

export interface ProfileStats {
  watchedCount: number;
  reviewedCount: number;
  accountScore: number;
}

interface ProfileBundle {
  user?: ProfileUser;
  profile?: ProfileDetails;
  badges: ProfileBadge[];
  eleven?: ElevenHighlight;
  topList: TopListEntry[];
  socials: SocialLink[];
  stats?: ProfileStats;
  isOwner?: boolean;
  error?: string;
}

const EMPTY_DATA: ProfileBundle = {
  user: undefined,
  profile: undefined,
  badges: [],
  eleven: undefined,
  topList: [],
  socials: [],
  stats: undefined,
  isOwner: undefined,
  error: undefined,
};

const normalizeBoolean = (value: unknown | null | undefined) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return undefined;
  }
  return Boolean(value);
};

async function fetchProfileBundle(userId: string, currentUserId?: string | null): Promise<ProfileBundle> {
  const isOwner = Boolean(currentUserId) && currentUserId === userId;

  const headerPromise = supabase
    .from('users')
    .select(
      `
        id,
        username,
        handle,
        avatar_url,
        level,
        exp,
        user_profiles(
          display_name,
          bio,
          show_level,
          show_socials,
          social_youtube,
          social_twitch,
          social_x
        )
      `,
    )
    .eq('id', userId)
    .maybeSingle();

  const badgesPromise = supabase
    .from('user_badges')
    .select(
      `
        is_showcased,
        unlocked_at,
        badges:badge_id (
          id,
          slug,
          name,
          tier,
          type
        )
      `,
    )
    .eq('user_id', userId)
    .eq('is_showcased', true)
    .order('unlocked_at', { ascending: false })
    .limit(5);

  const elevenPromise = supabase
    .from('ratings')
    .select('anime:anime_id (id, title, thumbnail_url, tags)')
    .eq('user_id', userId)
    .eq('is_eleven_out_of_ten', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const topListPromise = supabase
    .from('user_toplist')
    .select('position, note, anime:anime_id (title, thumbnail_url)')
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .limit(10);

  const socialsPromise = supabase
    .from('user_social_links')
    .select('platform, url')
    .eq('user_id', userId)
    .in('platform', ['youtube', 'twitch', 'twitter']);

  const watchedPromise = supabase
    .from('ratings')
    .select('anime_id', { head: true, count: 'exact' })
    .eq('user_id', userId);

  const reviewedPromise = supabase
    .from('reviews')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId);

  const [headerResult, badgesResult, elevenResult, topListResult, socialsResult, watchedResult, reviewedResult] =
    await Promise.allSettled([headerPromise, badgesPromise, elevenPromise, topListPromise, socialsPromise, watchedPromise, reviewedPromise]);

  const errors: string[] = [];
  let user: ProfileUser | undefined;
  let profile: ProfileDetails | undefined;
  let badges: ProfileBadge[] = [];
  let eleven: ElevenHighlight | undefined;
  let topList: TopListEntry[] = [];
  let socials: SocialLink[] = [];
  let watchedCount = 0;
  let reviewedCount = 0;

  if (headerResult.status === 'fulfilled') {
    const { data, error } = headerResult.value;
    if (error) {
      errors.push(error.message ?? 'Failed to load profile header.');
    } else if (data) {
      const profileRow = Array.isArray(data.user_profiles) ? data.user_profiles[0] : data.user_profiles;
      user = {
        id: data.id,
        username: data.username,
        handle: data.handle ?? null,
        avatar_url: data.avatar_url ?? null,
        level: data.level ?? null,
        exp: data.exp ?? null,
        bio: profileRow?.bio ?? null,
        show_level: normalizeBoolean(profileRow?.show_level),
        show_socials: normalizeBoolean(profileRow?.show_socials),
      };
      profile = {
        display_name: profileRow?.display_name ?? null,
        bio: profileRow?.bio ?? null,
        avatar_url: data.avatar_url ?? null,
        show_socials: normalizeBoolean(profileRow?.show_socials),
        social_youtube: profileRow?.social_youtube ?? null,
        social_twitch: profileRow?.social_twitch ?? null,
        social_x: profileRow?.social_x ?? null,
      };
    } else {
      errors.push('Profile header missing.');
    }
  } else {
    const reason = headerResult.reason as Error | undefined;
    errors.push(reason?.message ?? 'Failed to load profile header.');
  }

  if (badgesResult.status === 'fulfilled') {
    const { data, error } = badgesResult.value;
    if (error) {
      errors.push(error.message ?? 'Failed to load showcased badges.');
    } else if (data) {
      badges = data
        .map((item: any) => item?.badges)
        .filter(Boolean)
        .map((badge: any, index: number) => ({
          id: String(badge.id ?? `badge-${index}`),
          slug: String(badge.slug ?? `badge-${index}`),
          name: badge.name ?? 'Badge',
          tier: badge.tier ?? null,
          type: badge.type ?? null,
        }));
    }
  } else {
    const reason = badgesResult.reason as Error | undefined;
    errors.push(reason?.message ?? 'Failed to load showcased badges.');
  }

  if (elevenResult.status === 'fulfilled') {
    const { data, error } = elevenResult.value;
    if (error) {
      errors.push(error.message ?? 'Failed to load 11/10 highlight.');
    } else if (data) {
      eleven = {
        title: data.anime?.title ?? 'Untitled',
        thumbnail_url: data.anime?.thumbnail_url ?? null,
        anime: {
          id: data.anime?.id ?? undefined,
          title: data.anime?.title ?? 'Untitled',
          thumbnail_url: data.anime?.thumbnail_url ?? null,
          tags: (Array.isArray(data.anime?.tags) ? data.anime?.tags : null) as string[] | null,
        },
      };
    }
  } else {
    const reason = elevenResult.reason as Error | undefined;
    errors.push(reason?.message ?? 'Failed to load 11/10 highlight.');
  }

  if (topListResult.status === 'fulfilled') {
    const { data, error } = topListResult.value;
    if (error) {
      errors.push(error.message ?? 'Failed to load top list.');
    } else if (data) {
      topList = data.map((item: any) => ({
        position: item.position,
        title: item.anime?.title ?? 'Untitled',
        thumbnail_url: item.anime?.thumbnail_url ?? null,
        note: item.note ?? null,
        anime: {
          id: item.anime?.id ?? undefined,
          title: item.anime?.title ?? 'Untitled',
          thumbnail_url: item.anime?.thumbnail_url ?? null,
        },
      }));
    }
  } else {
    const reason = topListResult.reason as Error | undefined;
    errors.push(reason?.message ?? 'Failed to load top list.');
  }

  if (socialsResult.status === 'fulfilled') {
    const { data, error } = socialsResult.value;
    if (error) {
      errors.push(error.message ?? 'Failed to load social links.');
    } else if (data) {
      socials = data.map((item: any) => ({
        platform: item.platform as SocialLink['platform'],
        url: item.url,
      }));
    }
  } else {
    const reason = socialsResult.reason as Error | undefined;
    errors.push(reason?.message ?? 'Failed to load social links.');
  }

  if (watchedResult.status === 'fulfilled') {
    const { count, error } = watchedResult.value as { count?: number; error?: { message?: string } };
    if (error) {
      errors.push(error.message ?? 'Failed to load watched count.');
    } else {
      watchedCount = count ?? 0;
    }
  } else {
    const reason = watchedResult.reason as Error | undefined;
    errors.push(reason?.message ?? 'Failed to load watched count.');
  }

  if (reviewedResult.status === 'fulfilled') {
    const { count, error } = reviewedResult.value as { count?: number; error?: { message?: string } };
    if (error) {
      errors.push(error.message ?? 'Failed to load reviewed count.');
    } else {
      reviewedCount = count ?? 0;
    }
  } else {
    const reason = reviewedResult.reason as Error | undefined;
    errors.push(reason?.message ?? 'Failed to load reviewed count.');
  }

  const error = errors.length ? errors.join(' | ') : undefined;

  return {
    user,
    profile,
    badges,
    eleven,
    topList,
    socials,
    stats: {
      watchedCount,
      reviewedCount,
      accountScore: user?.exp ?? 0,
    },
    isOwner,
    error,
  };
}

function useProfileData(userId?: string) {
  const currentUserQuery = useQuery({
    queryKey: ['current-user-id'],
    queryFn: getCurrentUserId,
    enabled: !userId,
    staleTime: Infinity,
  });

  const resolvedUserId = userId ?? currentUserQuery.data;

  const profileQuery = useQuery({
    queryKey: ['profile', resolvedUserId, currentUserQuery.data ?? null],
    queryFn: () => fetchProfileBundle(resolvedUserId as string, currentUserQuery.data ?? null),
    enabled: Boolean(resolvedUserId),
  });

  const data = useMemo(() => profileQuery.data ?? EMPTY_DATA, [profileQuery.data]);
  const loading = currentUserQuery.isLoading || profileQuery.isLoading || profileQuery.isFetching;
  const errorMessages: string[] = [];

  if (currentUserQuery.error instanceof Error) {
    errorMessages.push(currentUserQuery.error.message);
  }
  if (data.error) {
    errorMessages.push(data.error);
  }

  const error = errorMessages.length ? errorMessages.join(' | ') : undefined;

  const refetch = async () => {
    await profileQuery.refetch();
  };

  return {
    loading,
    error,
    errorText: error,
    user: data.user,
    profile: data.profile,
    badges: data.badges ?? [],
    eleven: data.eleven,
    topList: data.topList ?? [],
    socials: data.socials ?? [],
    stats: data.stats,
    isOwner: data.isOwner,
    refetch,
  };
}

export { useProfileData };
export default useProfileData;
