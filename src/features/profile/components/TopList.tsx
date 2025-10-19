import React from 'react';
import { Image, Text, View } from 'react-native';
import type { TopListEntry } from '../hooks/useProfileData';

type TopListProps = {
  items: TopListEntry[];
};

export function TopList({ items }: TopListProps) {
  const hasItems = items.length > 0;

  return (
    <View className="border border-white/10 bg-white/5 p-4 rounded-xl" testID="TopListSection">
      <Text className="text-base font-semibold text-white">Top List</Text>
      {hasItems ? (
        <View className="mt-3 flex-col gap-3">
          {items.map((item, index) => (
            <View
              key={`${item.position}-${item.title}-${index}`}
              className="flex-row items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Text className="text-sm font-semibold text-white">{item.position}</Text>
              </View>
              {item.thumbnail_url ? (
                <Image source={{ uri: item.thumbnail_url }} className="h-20 w-16 rounded-lg" resizeMode="cover" />
              ) : (
                <View className="h-20 w-16 items-center justify-center rounded-lg bg-white/10">
                  <Text className="text-lg text-white/60">🎞</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">{item.title}</Text>
                {item.note ? (
                  <Text className="mt-1 text-xs text-white/70">{item.note}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text className="mt-3 text-sm text-white/60">Add your Top List later.</Text>
      )}
    </View>
  );
}

export default TopList;
