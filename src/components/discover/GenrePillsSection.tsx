import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { currentTheme, spacing, borderRadius } from '../../styles/discoverStyles';

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
      <Text style={styles.pillText}>{genre}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: currentTheme.foreground,
    marginBottom: spacing.lg,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: currentTheme.border,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillPressed: {
    backgroundColor: currentTheme.muted,
    transform: [{ scale: 0.98 }],
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: currentTheme.foreground,
  },
});
