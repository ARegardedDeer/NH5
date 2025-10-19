import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileData } from '../hooks/useProfileData';
import { ProfileHeader } from '../components/ProfileHeader';
import { ShowcasedBadges } from '../components/ShowcasedBadges';
import { ElevenHighlight } from '../components/ElevenHighlight';
import { TopList } from '../components/TopList';
import { SocialLinks } from '../components/SocialLinks';

export default function ProfileScreen() {
  const { loading, error, user, profile, badges, eleven, topList, socials, refetch } = useProfileData();

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-[#020617] items-center justify-center" edges={['top', 'left', 'right']}>
        <Text className="text-base text-white/70">Loading your profile…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#fff" />}
      >
        <ProfileHeader user={user} profile={profile} />
        <ShowcasedBadges badges={badges} />
        <ElevenHighlight eleven={eleven} />
        <TopList items={topList} />
        <SocialLinks profile={profile} links={socials} />
        {error ? (
          <View className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <Text className="text-sm font-semibold text-red-200">We couldn’t load everything.</Text>
            <Text className="mt-1 text-xs text-red-200/90">{error.message}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
