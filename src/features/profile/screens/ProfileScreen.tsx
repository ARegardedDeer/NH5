import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PosterImage from '../../../ui/components/PosterImage';
import ProgressBar from '../../../ui/components/ProgressBar';
import { SectionTitle, Card } from '../../../ui/components/Section';
import ProfileHeader from '../components/ProfileHeader';
import useProfileData from '../hooks/useProfileData';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const {
    user,
    badges = [],
    eleven,
    topList = [],
    stats,
    errorText,
    isOwner,
    displayName,
    handle,
    bio,
    showSocials,
    socials,
    avatarUrl,
  } = useProfileData();

  const resolvedDisplayName = displayName ?? user?.username ?? 'NH Explorer';
  const resolvedHandle = handle ?? user?.username ?? undefined;
  const level = user?.level ?? 1;
  const exp = user?.exp ?? 0;
  const nextLv = Math.max(1000, Math.ceil((level + 1) * 1000));
  const xpIntoLevel = exp % nextLv;
  const socialsData = socials ?? {};

  return (
    <ScrollView className="flex-1 bg-[#161022]">
      <ProfileHeader
        displayName={resolvedDisplayName}
        handle={resolvedHandle}
        bio={bio}
        level={user?.level}
        avatarUrl={avatarUrl ?? user?.avatar_url ?? null}
        canEdit={Boolean(isOwner)}
        onPressEdit={isOwner ? () => nav.navigate('EditProfile' as never) : undefined}
      />

      {/* Level / XP */}
      <Card>
        <Text className="text-white/80 mb-2">Level {level}</Text>
        <ProgressBar value={xpIntoLevel} max={nextLv} />
        <Text className="text-white/60 mt-2">
          {xpIntoLevel}/{nextLv} XP
        </Text>
      </Card>

      {/* Stats */}
      <View className="mx-4 my-2 flex-row gap-3">
        <View className="flex-1 items-center rounded-xl bg-zinc-900/80 p-4">
          <Text className="text-white text-2xl font-extrabold">{stats?.watchedCount ?? 0}</Text>
          <Text className="text-white/70 mt-1">Animes Watched</Text>
        </View>
        <View className="flex-1 items-center rounded-xl bg-zinc-900/80 p-4">
          <Text className="text-white text-2xl font-extrabold">{stats?.reviewedCount ?? 0}</Text>
          <Text className="text-white/70 mt-1">Animes Reviewed</Text>
        </View>
      </View>
      <View className="mx-4 my-2 rounded-xl bg-zinc-900/80 p-4 items-center">
        <Text className="text-white text-3xl font-extrabold">{stats?.accountScore ?? 0}</Text>
        <Text className="text-white/70 mt-1">Account Score</Text>
      </View>

      {/* Badges */}
      <SectionTitle>My Badges</SectionTitle>
      <ScrollView horizontal className="px-4 py-2" showsHorizontalScrollIndicator={false}>
        {badges.length ? (
          badges.map((b) => (
            <View key={b.id} className="mr-2 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-1">
              <Text className="text-white">{b.name}</Text>
            </View>
          ))
        ) : (
          <Text className="text-white/60 px-4">No showcased badges yet.</Text>
        )}
      </ScrollView>

      {/* 11/10 */}
      <SectionTitle>My 11/10 Anime</SectionTitle>
      <Card>
        {eleven?.anime ? (
          <View className="flex-row items-center gap-3">
            <PosterImage uri={eleven.anime.thumbnail_url || null} width={70} />
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">{eleven.anime.title}</Text>
              {!!eleven.anime.tags?.length && (
                <Text className="text-white/70 mt-1">{eleven.anime.tags.join(', ')}</Text>
              )}
            </View>
            {isOwner ? (
              <Pressable
                onPress={() => nav.navigate('ElevenPicker' as never)}
                className="rounded-full bg-white/10 px-3 py-2"
              >
                <Text className="text-white">Change</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Text className="text-white/80">Pick your all-time #1.</Text>
            {isOwner ? (
              <Pressable onPress={() => nav.navigate('ElevenPicker' as never)} className="rounded-full bg-purple-600 px-3 py-2">
                <Text className="text-white font-semibold">Set 11/10</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </Card>

      {/* Top List */}
      <SectionTitle>My Top List</SectionTitle>
      <ScrollView horizontal className="px-4 py-2" showsHorizontalScrollIndicator={false}>
        {topList.length ? (
          topList.map((t) => (
            <View key={t.position} className="mr-3 items-center">
              <PosterImage uri={t.anime?.thumbnail_url || null} width={90} />
              <Text className="text-white mt-1">{t.position}</Text>
            </View>
          ))
        ) : (
          <Text className="text-white/60 px-4">Add your Top List later.</Text>
        )}
      </ScrollView>

      {/* Socials */}
      {showSocials ? (
        <>
          <SectionTitle>Socials</SectionTitle>
          <Card>
            {socialsData.twitch ? (
              <Text className="text-white">
                Twitch{'\n'}
                {socialsData.twitch}
              </Text>
            ) : null}
            {socialsData.x ? (
              <Text className="text-white mt-3">
                X{'\n'}
                {socialsData.x}
              </Text>
            ) : null}
            {socialsData.youtube ? (
              <Text className="text-white mt-3">
                YouTube{'\n'}
                {socialsData.youtube}
              </Text>
            ) : null}
          </Card>
        </>
      ) : null}

      {/* errorText is exposed only in dev as a troubleshooting hint */}
      {__DEV__ && !!errorText && (
        <Text className="text-red-400 px-4 py-4">
          We couldn’t load everything.
          {'\n'}
          {errorText}
        </Text>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
