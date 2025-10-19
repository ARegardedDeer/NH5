import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import supabase from '../../../db/supabaseClient';
import { getCurrentUserId } from '../../../state/currentUser';

export interface ProfileUser {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number | null;
}

export interface ProfileDetails {
  bio: string | null;
  show_level: boolean;
  show_socials: boolean;
}

export interface ProfileBadge {
  id: string;
  name: string;
  icon: string | null;
}

export interface ElevenHighlight {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

export interface TopListEntry {
  id: string;
  position: number;
  title: string;
  thumbnail_url: string | null;
  note: string | null;
}

export interface SocialLink {
  platform: 'youtube' | 'twitch' | 'twitter';
  url: string;
}

export interface ProfileDataResult {
  user: ProfileUser | null;
  profile: ProfileDetails | null;
  badges: ProfileBadge[];
  eleven: ElevenHighlight | null;
  topList: TopListEntry[];
  socials: SocialLink[];
}

const EMPTY_RESULT: ProfileDataResult = {
  user: null,
  profile: null,
  badges: [],
  eleven: null,
  topList: [],
  socials: [],
};

async function fetchProfileBundle(userId: string): Promise<ProfileDataResult> {
  const [
    userRes,
    profileRes,
    badgesRes,
    elevenRes,
    topListRes,
    socialsRes,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, avatar_url, level')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('bio, show_level, show_socials')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_badges')
      .select('id, badge_id, badges(id, name, icon)')
      .eq('user_id', userId)
      .eq('is_showcased', true)
      .order('updated_at', { ascending: true })
      .limit(5),
    supabase
      .from('ratings')
      .select('id, anime:anime_id (title, thumbnail_url)')
      .eq('user_id', userId)
      .eq('is_eleven_out_of_ten', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_toplist')
      .select('id, position, note, anime:anime_id (title, thumbnail_url)')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .limit(10),
    supabase
      .from('user_social_links')
      .select('id, platform, url')
      .eq('user_id', userId)
      .in('platform', ['youtube', 'twitch', 'twitter']),
  ]);

  if (userRes.error) {
    throw userRes.error;
  }
  if (!userRes.data) {
    throw new Error('User not found for profile view.');
  }
  if (profileRes.error) {
    throw profileRes.error;
  }
  if (badgesRes.error) {
    throw badgesRes.error;
  }
  if (elevenRes.error) {
    throw elevenRes.error;
  }
  if (topListRes.error) {
    throw topListRes.error;
  }
  if (socialsRes.error) {
    throw socialsRes.error;
  }

  const badges =
    badgesRes.data?.slice(0, 5).map((item: any) => {
      const identifier = item.badge_id ?? item.id ?? item.badges?.id;
      return {
        id: String(identifier ?? 'badge'),
        name: item.badges?.name ?? 'Badge',
        icon: item.badges?.icon ?? null,
      };
    }) ?? [];

  const eleven = elevenRes.data
    ? {
        id: elevenRes.data.id,
        title: elevenRes.data.anime?.title ?? 'Untitled',
        thumbnail_url: elevenRes.data.anime?.thumbnail_url ?? null,
      }
    : null;

  const topList =
    topListRes.data?.map((item: any) => ({
      id: item.id ?? `${item.position}-${item.anime?.title ?? 'anime'}`,
      position: item.position,
      note: item.note ?? null,
      title: item.anime?.title ?? 'Untitled',
      thumbnail_url: item.anime?.thumbnail_url ?? null,
    })) ?? [];

  const socials =
    socialsRes.data?.map((item: any) => ({
      platform: item.platform as SocialLink['platform'],
      url: item.url,
    })) ?? [];

  return {
    user: userRes.data,
    profile: profileRes.data
      ? {
          bio: profileRes.data.bio ?? null,
          show_level: Boolean(profileRes.data.show_level),
          show_socials: Boolean(profileRes.data.show_socials),
        }
      : null,
    badges,
    eleven,
    topList,
    socials,
  };
}

export function useProfileData(userId?: string) {
  const currentUserQuery = useQuery({
    queryKey: ['current-user-id'],
    queryFn: getCurrentUserId,
    enabled: !userId,
    staleTime: Infinity,
  });

  const resolvedUserId = userId ?? currentUserQuery.data;

  const profileQuery = useQuery({
    queryKey: ['profile', resolvedUserId],
    queryFn: () => fetchProfileBundle(resolvedUserId as string),
    enabled: Boolean(resolvedUserId),
  });

  const loading = currentUserQuery.isLoading || profileQuery.isLoading || profileQuery.isFetching;
  const error = (currentUserQuery.error as Error) ?? (profileQuery.error as Error) ?? null;
  const data = useMemo(() => profileQuery.data ?? EMPTY_RESULT, [profileQuery.data]);

  return {
    loading,
    error,
    ...data,
    refetch: profileQuery.refetch,
  };
}
