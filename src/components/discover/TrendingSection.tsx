import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTrendingAnime } from '../../hooks/useTrendingAnime';

interface AnimeCard {
  id: string;
  title: string;
  thumbnail_url: string | null;
  synopsis: string | null;
  tags: string[] | null;
  episodes_count: number | null;
}

interface Props {
  onAnimePress: (anime: AnimeCard) => void;
}

export const TrendingSection: React.FC<Props> = ({ onAnimePress }) => {
  const { data: trendingAnime, isLoading, error } = useTrendingAnime();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </View>
    );
  }

  if (error || !trendingAnime || trendingAnime.length === 0) {
    return null; // Don't show section if no data
  }

  const renderAnimeCard = ({ item }: { item: AnimeCard }) => (
    <Pressable
      style={styles.card}
      onPress={() => onAnimePress(item)}
    >
      {/* Poster */}
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={styles.poster}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Episode count */}
      {item.episodes_count && (
        <Text style={styles.episodes}>
          {item.episodes_count} episodes
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>🔥 Trending Now</Text>

      <FlatList
        data={trendingAnime}
        renderItem={renderAnimeCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: -0.4,
  },

  loadingContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingHorizontal: 20,
  },

  card: {
    width: 140,
  },

  poster: {
    width: 140,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    marginBottom: 8,
  },

  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    fontSize: 12,
    color: '#86868B',
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    lineHeight: 18,
    letterSpacing: -0.2,
  },

  episodes: {
    fontSize: 13,
    color: '#86868B',
    letterSpacing: -0.1,
  },
});
