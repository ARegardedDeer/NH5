import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useContinueWatching } from '../../hooks/useContinueWatching';
import { ContinueWatchingCard } from './ContinueWatchingCard';

interface ContinueWatchingSectionProps {
  userId: string;
  limit?: number; // 3 for Home, undefined for My List
  onSeeAll?: () => void; // Navigate to My List (only for Home)
}

export const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({
  userId,
  limit,
  onSeeAll,
}) => {
  const { data: continueWatching, isLoading, error } = useContinueWatching({ userId, limit });

  const handleContinue = (animeId: string) => {
    // TODO: Navigate to episode picker or increment episode
    console.log('[ContinueWatching] Continue clicked for anime:', animeId);
    // This will be implemented when we build the episode picker
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Continue Watching</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </View>
    );
  }

  if (error) {
    console.error('[ContinueWatching] Error:', error);
    return null; // Don't show section if error
  }

  // Don't show section if no items
  if (!continueWatching || continueWatching.length === 0) {
    return null;
  }

  const showSeeAll = onSeeAll && limit && continueWatching.length >= limit;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Continue Watching</Text>
        {showSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal Scrolling List */}
      <FlatList
        data={continueWatching}
        renderItem={({ item }) => (
          <ContinueWatchingCard
            anime={item.anime}
            currentEpisode={item.current_episode}
            totalEpisodes={item.total_episodes}
            onContinue={() => handleContinue(item.anime_id)}
          />
        )}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    letterSpacing: -0.4,
  },

  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
    letterSpacing: -0.2,
  },

  loadingContainer: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingHorizontal: 20,
  },
});
