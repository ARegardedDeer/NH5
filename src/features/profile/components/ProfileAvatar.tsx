import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type Props = {
  userId?: string | null;
  demoUserId?: string | null;
  remoteUri?: string | null;
  size?: number;
};

export default function ProfileAvatar({ userId, demoUserId, remoteUri, size = 80 }: Props) {
  const localDemo = demoUserId && userId === demoUserId;
  const src =
    localDemo
      ? require('../../../assets/avatar/demo.png')
      : remoteUri
        ? { uri: remoteUri }
        : require('../../../assets/avatar/demo.png');

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={src} style={{ width: size, height: size, borderRadius: size / 2 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#2a223b' },
});
