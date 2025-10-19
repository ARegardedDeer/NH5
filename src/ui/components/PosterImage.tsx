import React from 'react';
import { Image, View, Text } from 'react-native';

export default function PosterImage({ uri, width = 90 }: { uri?: string | null; width?: number }) {
  const height = Math.round((width * 4) / 3);

  if (uri) {
    return <Image source={{ uri }} style={{ width, height, borderRadius: 12 }} />;
  }

  return (
    <View style={{ width, height, borderRadius: 12 }} className="items-center justify-center bg-zinc-800">
      <Text className="text-xs text-white/60">No Image</Text>
    </View>
  );
}
