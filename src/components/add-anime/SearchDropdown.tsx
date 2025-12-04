import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

interface SearchDropdownProps {
  results: Array<{
    id: string;
    title: string;
    thumbnail_url: string | null;
    genres: string[] | null;
  }>;
  isLoading: boolean;
  onSelectResult: (result: any) => void;
  maxResults?: number;
  searchQuery: string;
}

/**
 * Dropdown autocomplete for anime search.
 * Shows 5-8 suggestions below search bar (like Google autocomplete).
 */
export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  results,
  isLoading,
  onSelectResult,
  maxResults = 8,
  searchQuery,
}) => {
  if (isLoading) {
    return (
      <Animated.View
        style={styles.dropdown}
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      </Animated.View>
    );
  }

  if (!results || results.length === 0) {
    if (searchQuery.length < 2) {
      return null; // Don't show anything for queries < 2 chars
    }

    return (
      <Animated.View
        style={styles.dropdown}
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      </Animated.View>
    );
  }

  const displayResults = results.slice(0, maxResults);
  const hasMore = results.length > maxResults;

  return (
    <Animated.View
      style={styles.dropdown}
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {displayResults.map((result) => (
          <Pressable
            key={result.id}
            style={({ pressed }) => [
              styles.resultItem,
              pressed && styles.resultItemPressed,
            ]}
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              onSelectResult(result);
            }}
          >
            <Image
              source={{
                uri: result.thumbnail_url || 'https://via.placeholder.com/40x56?text=No+Image',
              }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {result.title}
              </Text>
              <Text style={styles.resultGenres} numberOfLines={1}>
                {result.genres?.slice(0, 2).join(', ') || 'Unknown'}
              </Text>
            </View>
          </Pressable>
        ))}

        {hasMore && (
          <View style={styles.moreIndicator}>
            <Text style={styles.moreText}>
              +{results.length - maxResults} more results
            </Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    top: 60, // Below search bar (adjust based on your search bar height)
    left: 0,
    right: 0,
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  resultItemPressed: {
    backgroundColor: '#2A2A3E',
  },
  thumbnail: {
    width: 40,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#2A2A3E',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultGenres: {
    fontSize: 13,
    color: '#86868B',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#86868B',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#86868B',
  },
  moreIndicator: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  moreText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
});
