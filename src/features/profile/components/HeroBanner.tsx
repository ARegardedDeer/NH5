import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions } from 'react-native';

type Props = {
  title?: string | null;
  imageUri?: string | null;
};

const { width } = Dimensions.get('window');
const HERO_H = Math.round(width * 0.42);

export default function HeroBanner({ title, imageUri }: Props) {
  return (
    <View style={styles.container}>
      {imageUri ? (
        <ImageBackground
          source={{ uri: imageUri }}
          blurRadius={12}
          resizeMode="cover"
          style={styles.bg}
        >
          <View style={styles.overlay} />
          <Text numberOfLines={1} style={styles.title}>
            {title ?? 'Featured'}
          </Text>
        </ImageBackground>
      ) : (
        <View style={[styles.bg, styles.fallback]}>
          <Text numberOfLines={1} style={styles.title}>Featured</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: HERO_H, marginBottom: 12 },
  bg: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,14,0.45)',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fallback: { backgroundColor: '#1b1626' },
});
