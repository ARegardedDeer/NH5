import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { currentTheme, spacing, borderRadius, shadow } from '../../styles/discoverStyles';

const GENRES = [
  'Action',
  'Horror',
  'Comedy',
  'Romance',
  'Psychological',
  'Slice of Life',
  'Isekai',
  'Mecha',
  'Sports',
  'Mystery',
];

export function GenrePillsSection() {
  const handleGenrePress = (genre: string) => {
    console.log('[discover] Genre pressed:', genre);
    // TODO: Implement genre filter/navigation
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.title}>🏷️ Browse by Genre</Text>

      {/* Pills Grid */}
      <View style={styles.pillsContainer}>
        {GENRES.map((genre) => (
          <GenrePill
            key={genre}
            genre={genre}
            onPress={handleGenrePress}
          />
        ))}
      </View>
    </View>
  );
}

interface GenrePillProps {
  genre: string;
  onPress: (genre: string) => void;
}

function GenrePill({ genre, onPress }: GenrePillProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        pressed && styles.pillPressed,
      ]}
      onPress={() => onPress(genre)}
    >
      {({ pressed }) => (
        <Text style={[styles.pillText, pressed && styles.pillTextPressed]}>
          {genre}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: currentTheme.foreground,
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pill: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: currentTheme.border,
    backgroundColor: currentTheme.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  pillPressed: {
    backgroundColor: currentTheme.primary,
    borderColor: currentTheme.primary,
    transform: [{ scale: 0.96 }],
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: currentTheme.foreground,
  },
  pillTextPressed: {
    color: currentTheme.primaryForeground,
  },
});
