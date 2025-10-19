import React, { PropsWithChildren } from 'react';
import { View, Text } from 'react-native';

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text className="px-4 pt-5 pb-2 text-[22px] font-bold text-white">{children}</Text>;
}

export function Card({ children }: PropsWithChildren) {
  return <View className="mx-4 my-2 rounded-xl bg-zinc-900/80 p-4">{children}</View>;
}
