import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import PosterImage from '../../../ui/components/PosterImage';

type Props = {
  title?: string | null;
  imageUri?: string | null;
};

const { width } = Dimensions.get('window');
const HERO_H = Math.round(width * 0.42);

export default function HeroBanner({ title, imageUri }: Props) {
  console.log('[banner] imageUri:', imageUri);

  return (
    <View style={styles.container}>
      {imageUri ? (
        <ImageBackground
          source={{ uri: imageUri }}
          blurRadius={12}
          resizeMode="cover"
          style={styles.bg}
          imageStyle={styles.bgImage}
        >
          <View style={styles.overlay} pointerEvents="none" />
          <View style={styles.content}>
            {console.log('[banner] poster prop value:', imageUri)}
            {console.log('[banner] final poster uri:', imageUri)}
            <PosterImage uri={imageUri} width={112} />
            <View style={styles.info}>
              <Text numberOfLines={2} style={styles.title}>
                {title ?? 'Featured'}
              </Text>
            </View>
          </View>
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
  container: { width: '100%', height: HERO_H, marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  bg: { flex: 1, justifyContent: 'flex-end' },
  bgImage: { borderRadius: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,14,0.45)',
    zIndex: 0,
    borderRadius: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  fallback: { backgroundColor: '#1b1626' },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 16,
    gap: 16,
    zIndex: 1,
  },
  info: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
