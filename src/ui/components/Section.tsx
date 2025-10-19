import React, { ReactNode } from 'react';
import { View, Text, ViewProps } from 'react-native';

type Props = ViewProps & {
  title: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
};

export default function Section({ title, children, dark = true, className, ...rest }: Props) {
  return (
    <View
      className={`rounded-2xl ${dark ? 'bg-card border border-cardBorder' : 'bg-white'} p-4 ${className ?? ''}`}
      {...rest}
    >
      <Text className={`mb-2 font-semibold ${dark ? 'text-white' : 'text-black'}`}>{title}</Text>
      {children}
    </View>
  );
}

