import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useContinueWatching } from '../../hooks/useContinueWatching';
import { ContinueWatchingCard } from './ContinueWatchingCard';
import { ContinueWatchingCardV2 } from './ContinueWatchingCardV2';
import { EpisodePickerModal } from './EpisodePickerModal';

const USE_V2 = true;

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
  const { data: continueWatching, isLoading, error } = useContinueWatching({ limit, userId });
  const [selectedAnime, setSelectedAnime] = useState<any>(null);

  const handleContinue = (item: any) => {
    setSelectedAnime(item);
  };

  const handleCloseModal = () => {
    setSelectedAnime(null);
  };

  const handleSeriesComplete = (animeId: string) => {
    // TODO: Show rating modal and badge unlock
    console.log('[ContinueWatching] Series completed:', animeId);
    // This will be implemented when we build the completion flow
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
    return null;
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
          USE_V2 ? (
            <ContinueWatchingCardV2
              anime={item.anime}
              status={item.status}
              currentEpisode={item.current_episode}
              totalEpisodes={item.total_episodes}
              onContinue={() => handleContinue(item)}
            />
          ) : (
            <ContinueWatchingCard
              anime={item.anime}
              currentEpisode={item.current_episode}
              totalEpisodes={item.total_episodes}
              onContinue={() => handleContinue(item)}
            />
          )
        )}
        keyExtractor={(item) => `${item.user_id}-${item.anime_id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />

      {/* Episode Picker Modal */}
      {selectedAnime && (
        <EpisodePickerModal
          visible={!!selectedAnime}
          onClose={handleCloseModal}
          animeId={selectedAnime.anime_id}
          animeTitle={selectedAnime.anime.title}
          currentEpisode={selectedAnime.current_episode}
          totalEpisodes={selectedAnime.total_episodes}
          hasSpecials={selectedAnime.anime.has_specials || false}
          userId={userId}
          onComplete={handleSeriesComplete}
        />
      )}
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
