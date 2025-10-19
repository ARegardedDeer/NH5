import React from 'react';
import { Text, View } from 'react-native';
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
        <View className="flex-row flex-wrap gap-2">
          {badges.map((badge) => (
            <Text
              key={badge.id}
              className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold"
            >
              {badge.name}
            </Text>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-white/60">No showcased badges yet.</Text>
      )}
    </View>
  );
}

export default ShowcasedBadges;
