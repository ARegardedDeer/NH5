import React from 'react';
import { View, Text, Image } from 'react-native';

type Props = { name?: string; uri?: string | null; size?: number };

export default function Avatar({ name = 'NH', uri, size = 96 }: Props) {
  const initials = (name || 'NH').trim().slice(0, 2).toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-zinc-800"
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-zinc-800"
    >
      <Text className="text-white font-bold">{initials}</Text>
    </View>
  );
}
