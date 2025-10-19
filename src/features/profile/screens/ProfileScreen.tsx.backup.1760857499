import React, { useCallback, useMemo } from 'react';
import { ScrollView, View, Text, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useProfileData from '../hooks/useProfileData';
import Avatar from '../../../ui/components/Avatar';
import Section from '../../../ui/components/Section';
import ProgressBar from '../../../ui/components/ProgressBar';
import PosterImage from '../../../ui/components/PosterImage';

const FALLBACK_BADGES = ['Isekai Addict', 'Horror Connoisseur', 'Slice-of-Life Sage'];

export default function ProfileScreen() {
  const {
    loading,
    errorText,
    refetch,
    displayName,
    handle,
    bio,
    stats,
    eleven,
    topList = [],
    showSocials,
    socials,
    badges = [],
    avatarUrl,
    user,
    isOwner,
  } = useProfileData();

  const onRefresh = useCallback(() => {
    refetch?.();
  }, [refetch]);

  const badgeItems = useMemo(() => {
    if (badges.length) {
      return badges.map((badge) => badge.name ?? 'Badge');
    }
    return FALLBACK_BADGES;
  }, [badges]);

  const level = user?.level ?? 1;
  const totalExp = Math.max(1000, Math.ceil((level + 1) * 1000));
  const exp = user?.exp ?? 0;
  const progressValue = exp % totalExp;

  const renderTitle = (text: string, extra?: string) => (
    <Text className={`text-white text-base font-semibold ${extra ?? ''}`}>{text}</Text>
  );

  const renderBody = (text: string, extra?: string) => (
    <Text className={`text-zinc-300 text-sm ${extra ?? ''}`}>{text}</Text>
  );

  const renderStat = (label: string, value: string | number) => (
    <View key={label} className="items-center px-4">
      <Text className="text-white text-xl font-bold">{String(value)}</Text>
      <Text className="text-zinc-400 text-xs mt-1">{label}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="bg-[#0F0D1A] flex-1">
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl tintColor="#fff" refreshing={Boolean(loading)} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center gap-3 mt-2 mb-8">
          <Avatar name={displayName} uri={avatarUrl ?? user?.avatar_url ?? null} size={72} />
          <View className="flex-1">
            <Text className="text-white text-xl font-bold" numberOfLines={1}>
              {displayName ?? user?.username ?? 'NH Explorer'}
            </Text>
            {!!handle && <Text className="text-zinc-400">@{handle}</Text>}
            {!!bio && renderBody(bio)}
          </View>
          {isOwner ? (
            <Pressable className="px-3 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/30">
              <Text className="text-indigo-200 font-semibold text-sm">Edit</Text>
            </Pressable>
          ) : null}
        </View>

        <Section title="Next Level Progress" className="mb-8">
          <View className="mt-2">
            <ProgressBar value={progressValue} max={totalExp} />
            <Text className="text-zinc-400 text-xs mt-2">
              {progressValue}/{totalExp} XP
            </Text>
          </View>
        </Section>

        <Section title="My Stats" className="mb-10">
          <View className="flex-row justify-between mt-4">
            {[
              { label: 'Animes Watched', value: stats?.watchedCount ?? 0 },
              { label: 'Animes Reviewed', value: stats?.reviewedCount ?? 0 },
              { label: 'Account Score', value: stats?.accountScore ?? 0 },
            ].map((item) => renderStat(item.label, item.value))}
          </View>
        </Section>

        <Section title="My Badges" className="mb-10">
          <View className="flex-row flex-wrap gap-2 mt-3">
            {badgeItems.map((badge) => (
              <Text
                key={badge}
                className="text-xs text-indigo-200 bg-indigo-500/15 px-3 py-1 rounded-full"
              >
                {badge}
              </Text>
            ))}
          </View>
        </Section>

        <Section title="My 11/10 Anime" className="mb-10">
          <View className="mt-4 flex-row items-center gap-4">
            {eleven?.anime ? (
              <>
                <PosterImage uri={eleven.anime.thumbnail_url || null} width={96} />
                <View className="flex-1">
                  <Text className="text-white font-semibold" numberOfLines={1}>
                    {eleven.anime.title}
                  </Text>
                  {!!eleven.anime.tags?.length && (
                    <Text className="text-zinc-400 text-xs" numberOfLines={1}>
                      {eleven.anime.tags.join(', ')}
                    </Text>
                  )}
                </View>
                {isOwner ? (
                  <Pressable className="px-3 py-2 rounded-full bg-white/10">
                    <Text className="text-white font-semibold text-sm">Change</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              renderBody('Pick your all-time #1 later.', 'mt-1')
            )}
          </View>
        </Section>

        <Section title="My Top List" className="mb-10">
          <View className="flex-row gap-3 mt-4">
            {topList.length ? (
              topList.slice(0, 10).map((entry) => (
                <PosterImage key={entry.position} uri={entry.anime?.thumbnail_url || null} width={112} />
              ))
            ) : (
              renderBody('Add your Top List later.')
            )}
          </View>
        </Section>

        <Section title="Socials" className="mb-16">
          {showSocials && socials ? (
            <View className="mt-3 gap-2">
              {socials.twitch ? renderBody(`Twitch  ·  ${socials.twitch}`) : null}
              {socials.x ? renderBody(`X       ·  ${socials.x}`) : null}
              {socials.youtube ? renderBody(`YouTube ·  ${socials.youtube}`) : null}
            </View>
          ) : (
            renderBody('No socials added yet.')
          )}
        </Section>

        {__DEV__ && !!errorText ? (
          <View className="bg-red-500/15 border border-red-800 rounded-lg p-3 mb-10">
            <Text className="text-red-300 text-xs">{String(errorText)}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

