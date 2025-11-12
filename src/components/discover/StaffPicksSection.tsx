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
import { currentTheme, spacing, borderRadius, shadow } from '../../styles/discoverStyles';

interface StaffPick {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

interface StaffPicksSectionProps {
  onAnimePress: (animeId: string) => void;
}

export function StaffPicksSection({ onAnimePress }: StaffPicksSectionProps) {
  // Fetch real anime from Supabase
  const { data: staffPicks, isLoading } = useQuery({
    queryKey: ['staff-picks'],
    queryFn: async () => {
      console.log('[discover] Fetching staff picks...');
      const { data, error } = await supabase
        .from('anime')
        .select('id, title, thumbnail_url')
        .not('thumbnail_url', 'is', null) // Only anime with images
        .limit(10);

      if (error) {
        console.error('[discover] Staff picks fetch error:', error);
        return [];
      }

      console.log('[discover] Fetched staff picks:', data?.length);
      return data as StaffPick[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handlePress = (pick: StaffPick) => {
    console.log('[discover] Staff pick pressed:', pick.title, pick.id);
    onAnimePress(pick.id);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>✨ Staff Picks</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
        </View>
      </View>
    );
  }

  // Empty state
  if (!staffPicks || staffPicks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.title}>✨ Staff Picks</Text>
        <Text style={styles.subtitle}>Curated by the Nimehime team</Text>
      </View>

      {/* Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={160 + spacing.md} // Card width + gap
      >
        {staffPicks.map((pick) => (
          <StaffPickCard key={pick.id} pick={pick} onPress={handlePress} />
        ))}
      </ScrollView>
    </View>
  );
}

interface StaffPickCardProps {
  pick: StaffPick;
  onPress: (pick: StaffPick) => void;
}

function StaffPickCard({ pick, onPress }: StaffPickCardProps) {
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
        onPress={() => onPress(pick)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Poster Image */}
        <View style={styles.imageContainer}>
          {pick.thumbnail_url ? (
            <Image
              source={{ uri: pick.thumbnail_url }}
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
            {pick.title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: currentTheme.foreground,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: currentTheme.mutedForeground,
  },
  loadingContainer: {
    height: 225,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: spacing.lg,
  },
  cardContainer: {
    width: 160,
    ...shadow.md,
    backgroundColor: currentTheme.card,
    borderRadius: borderRadius.lg,
  },
  imageContainer: {
    width: 160,
    height: 225,
    borderRadius: borderRadius.md,
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
