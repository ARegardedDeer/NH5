import React from 'react';
import { Image, Text, View } from 'react-native';
import type { ElevenHighlight as ElevenHighlightType } from '../hooks/useProfileData';

type ElevenHighlightProps = {
  eleven?: ElevenHighlightType;
};

export function ElevenHighlight({ eleven }: ElevenHighlightProps) {
  return (
    <View className="border border-white/10 bg-white/5 p-4 rounded-xl" testID="ElevenHighlightSection">
      <Text className="text-base font-semibold text-white">11/10 Highlight</Text>
      {eleven ? (
        <View className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <View className="relative">
            {eleven.thumbnail_url ? (
              <Image source={{ uri: eleven.thumbnail_url }} className="h-44 w-full" resizeMode="cover" />
            ) : (
              <View className="h-44 items-center justify-center bg-black/60">
                <Text className="text-2xl text-white/60">🎬</Text>
              </View>
            )}
            <View className="absolute right-3 top-3 rounded-full bg-fuchsia-500/90 px-3 py-1">
              <Text className="text-xs font-bold text-white">11/10</Text>
            </View>
          </View>
          <View className="p-3">
            <Text className="text-lg font-semibold text-white">{eleven.title}</Text>
          </View>
        </View>
      ) : (
        <Text className="mt-3 text-sm text-white/60">Pick your all-time #1 later.</Text>
      )}
    </View>
  );
}

export default ElevenHighlight;
