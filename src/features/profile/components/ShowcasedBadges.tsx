import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import type { ProfileBadge } from '../hooks/useProfileData';

type ShowcasedBadgesProps = {
  badges: ProfileBadge[];
};

export function ShowcasedBadges({ badges }: ShowcasedBadgesProps) {
  const hasBadges = badges.length > 0;

  return (
    <View className="border border-white/10 bg-white/5 p-4 rounded-xl" testID="ShowcasedBadgesSection">
      <Text className="text-base font-semibold text-white mb-3">Showcased Badges</Text>
      {hasBadges ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {badges.map((badge) => (
            <View
              key={badge.id}
              className="flex-row items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2"
            >
              {badge.icon ? (
                <Image source={{ uri: badge.icon }} className="h-6 w-6 rounded-full bg-white/10" />
              ) : (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <Text className="text-xs font-semibold text-white/80">★</Text>
                </View>
              )}
              <Text className="text-sm font-medium text-white/90">{badge.name}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text className="text-sm text-white/60">No showcased badges yet.</Text>
      )}
    </View>
  );
}

export default ShowcasedBadges;

