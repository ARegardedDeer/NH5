import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../db/supabaseClient';
import { currentTheme, spacing, borderRadius } from '../../styles/discoverStyles';

interface Anime {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

interface BecauseYouWatchedProps {
  userId: string;
  onAnimePress: (animeId: string) => void;
}

interface TopRatedAnime {
  anime_id: string;
  anime: {
    id: string;
    title: string;
    tags: string[] | null;
  };
}

export function BecauseYouWatchedSection({
  userId,
  onAnimePress,
}: BecauseYouWatchedProps) {
  // Fetch user's top-rated anime
  const { data: topRated } = useQuery<TopRatedAnime | null>({
    queryKey: ['top-rated', userId],
    enabled: !!userId,
    queryFn: async () => {
      console.log('[discover] Fetching top rated anime for user:', userId);
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          anime_id,
          score_overall,
          anime:anime_id (id, title, tags)
        `)
        .eq('user_id', userId)
        .order('score_overall', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('[discover] Top rated fetch error:', error);
        return null;
      }

      // Supabase returns anime as an array, take first element
      const animeData = Array.isArray((data as any)?.anime) ? (data as any).anime[0] : (data as any)?.anime;

      if (!animeData) {
        return null;
      }

      const result = {
        anime_id: (data as any).anime_id,
        anime: animeData,
      };

      console.log('[discover] Top rated anime:', result.anime?.title);
      return result as TopRatedAnime;
    },
  });

  // Fetch recommendations based on tags
  const { data: recommendations, isLoading } = useQuery<Anime[]>({
    queryKey: ['recommendations', topRated?.anime_id],
    enabled: !!topRated?.anime?.tags && topRated.anime.tags.length > 0,
    queryFn: async () => {
      if (!topRated?.anime?.tags) return [];

      console.log('[discover] Fetching recommendations based on tags:', topRated.anime.tags);
      const tags = topRated.anime.tags;

      const { data, error } = await supabase
        .from('anime')
        .select('id, title, thumbnail_url, tags')
        .contains('tags', tags) // PostgreSQL JSONB contains
        .neq('id', topRated.anime_id) // Exclude the source anime
        .not('thumbnail_url', 'is', null)
        .limit(5);

      if (error) {
        console.error('[discover] Recommendations fetch error:', error);
        return [];
      }

      console.log('[discover] Fetched recommendations:', data?.length);
      return data as Anime[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handlePress = (anime: Anime) => {
    console.log('[discover] Recommendation pressed:', anime.title, anime.id);
    onAnimePress(anime.id);
  };

  // Don't render if no top rated anime or no recommendations
  if (!topRated?.anime || !recommendations || recommendations.length === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            🎯 Because You Watched{' '}
            <Text style={styles.sourceTitle}>{topRated.anime.title}</Text>
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          🎯 Because You Watched{' '}
          <Text style={styles.sourceTitle}>{topRated.anime.title}</Text>
        </Text>
        <View style={styles.reasoningChip}>
          <Text style={styles.reasoningText}>Similar Tags</Text>
        </View>
      </View>

      {/* Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={160 + spacing.md} // Card width + gap
      >
        {recommendations.map((anime) => (
          <RecommendationCard
            key={anime.id}
            anime={anime}
            onPress={handlePress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface RecommendationCardProps {
  anime: Anime;
  onPress: (anime: Anime) => void;
}

function RecommendationCard({ anime, onPress }: RecommendationCardProps) {
  const scaleAnim = new Animated.Value(1);
  const opacityAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPress={() => onPress(anime)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Poster Image */}
        <View style={styles.imageContainer}>
          {anime.thumbnail_url ? (
            <Image
              source={{ uri: anime.thumbnail_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>📺</Text>
            </View>
          )}
        </View>

        {/* Card Text */}
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {anime.title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: currentTheme.foreground,
    marginBottom: spacing.sm,
  },
  sourceTitle: {
    color: currentTheme.primary,
  },
  reasoningChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  reasoningText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4F46E5',
  },
  loadingContainer: {
    height: 225,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardContainer: {
    width: 160,
  },
  imageContainer: {
    width: 160,
    height: 225,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: currentTheme.muted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: currentTheme.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  textContainer: {
    marginTop: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: currentTheme.foreground,
  },
});
