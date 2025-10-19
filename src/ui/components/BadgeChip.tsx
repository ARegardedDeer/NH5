import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  label: string;
};

export default function BadgeChip({ label }: Props) {
  return (
    <View className="mr-2 mb-2 rounded-full bg-white/10 px-3 py-1">
      <Text className="text-xs font-medium text-white">{label}</Text>
    </View>
  );
}
