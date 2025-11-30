import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface GenrePillsProps {
  tags?: string[] | null;
  genres?: string[] | null; // back-compat
  maxVisible?: number;
  max?: number;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'overlay';
}

export function GenrePills({
  tags,
  genres,
  maxVisible = 3,
  max,
  style,
  variant = 'default',
}: GenrePillsProps) {
  const source = Array.isArray(tags)
    ? tags
    : Array.isArray(genres)
      ? genres
      : [];

  if (!source.length) {
    return null;
  }

  const validGenres = source.filter((genre) => typeof genre === 'string' && genre.trim().length > 0);

  if (validGenres.length === 0) {
    return null;
  }

  const limit = typeof max === 'number' ? max : maxVisible;

  const visibleGenres = validGenres.slice(0, limit);
  const hasMore = validGenres.length > limit;

  return (
    <View style={[styles.container, style]}>
      {visibleGenres.map((genre, idx) => (
        <View
          key={idx}
          style={[
            styles.pill,
            variant === 'overlay' && styles.pillOverlay,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              variant === 'overlay' && styles.pillTextOverlay,
            ]}
          >
            {genre}
          </Text>
        </View>
      ))}
      {hasMore && (
        <View
          style={[
            styles.pill,
            variant === 'overlay' && styles.pillOverlay,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              variant === 'overlay' && styles.pillTextOverlay,
            ]}
          >
            +{validGenres.length - limit}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  // Default style (light background)
  pill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6D28D9',
  },
  // Overlay style (for dark backgrounds)
  pillOverlay: {
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillTextOverlay: {
    color: '#FFFFFF',
  },
});
