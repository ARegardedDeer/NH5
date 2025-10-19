import React from 'react';
import { View } from 'react-native';

export default function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));

  return (
    <View className="mx-4 mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
      <View style={{ width: `${pct * 100}%` }} className="h-2 rounded-full bg-purple-500" />
    </View>
  );
}
