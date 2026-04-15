import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export interface RewatchedAnime {
  animeId: string;
  title: string;
  thumbnailUrl: string | null;
  rewatchCount: number;
}

interface MostRewatchedSectionProps {
  data: RewatchedAnime[];
}

export default function MostRewatchedSection({ data }: MostRewatchedSectionProps) {
  if (data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Most Rewatched</Text>
      {data.map((item) => (
        <View key={item.animeId} style={styles.row}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={[styles.poster, styles.posterFallback]} />
          )}
          <View style={styles.info}>
            <Text style={styles.animeTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.rewatchCount}>Rewatched {item.rewatchCount}×</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1330',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  poster: {
    width: 52,
    height: 74,
    borderRadius: 8,
  },
  posterFallback: {
    backgroundColor: '#2a1f4a',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  animeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rewatchCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A78BFA',
  },
});
