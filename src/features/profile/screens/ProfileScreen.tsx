import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Avatar from '../../../ui/components/Avatar';
import PosterImage from '../../../ui/components/PosterImage';
import ProgressBar from '../../../ui/components/ProgressBar';
import { SectionTitle, Card } from '../../../ui/components/Section';
import useProfileData from '../hooks/useProfileData';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { user, profile, badges = [], eleven, topList = [], stats, errorText, isOwner } = useProfileData();

  const name = profile?.display_name || user?.username || 'NH Explorer';
  const handle = user?.handle ? `@${user.handle}` : user?.username ? `@${user.username}` : '';
  const level = user?.level ?? 1;
  const exp = user?.exp ?? 0;
  const nextLv = Math.max(1000, Math.ceil((level + 1) * 1000));
  const xpIntoLevel = exp % nextLv;

  return (
    <ScrollView className="flex-1 bg-[#161022]">
      {/* Header */}
      <View className="px-4 pt-6 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Avatar name={name} uri={profile?.avatar_url || user?.avatar_url || null} size={84} />
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{name}</Text>
            {!!handle && <Text className="text-white/70">{handle}</Text>}
            {!!profile?.bio && <Text className="text-white/80 mt-1">{profile.bio}</Text>}
          </View>
        </View>
        {isOwner ? (
          <Pressable onPress={() => nav.navigate('EditProfile' as never)} className="rounded-full bg-purple-600 px-4 py-2">
            <Text className="text-white font-semibold">Edit</Text>
          </Pressable>
        ) : null}
      </View>

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
      {profile?.show_socials ? (
        <>
          <SectionTitle>Socials</SectionTitle>
          <Card>
            {profile?.social_twitch ? (
              <Text className="text-white">
                Twitch{'\n'}
                {profile.social_twitch}
              </Text>
            ) : null}
            {profile?.social_x ? (
              <Text className="text-white mt-3">
                X{'\n'}
                {profile.social_x}
              </Text>
            ) : null}
            {profile?.social_youtube ? (
              <Text className="text-white mt-3">
                YouTube{'\n'}
                {profile.social_youtube}
              </Text>
            ) : null}
          </Card>
        </>
      ) : null}

      {!!errorText && (
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
