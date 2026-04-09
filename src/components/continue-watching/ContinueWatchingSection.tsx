import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useContinueWatching } from '../../hooks/useContinueWatching';
import { useUpdateListStatus } from '../../hooks/useUpdateListStatus';
import { ContinueWatchingCard } from './ContinueWatchingCard';
import { ContinueWatchingCardV2 } from './ContinueWatchingCardV2';
import { EpisodePickerModal } from './EpisodePickerModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const updateStatusMutation = useUpdateListStatus();
  const queryClient = useQueryClient();
  const [selectedAnime, setSelectedAnime] = useState<any>(null);

  const handleContinue = (item: any) => {
    setSelectedAnime(item);
  };

  const handleCloseModal = () => {
    setSelectedAnime(null);
  };

  const handleRemove = useCallback((animeId: string) => {
    if (!userId) return;
    const queryKey = ['continue-watching', userId, limit];
    const previousData = queryClient.getQueryData(queryKey);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    queryClient.setQueryData(queryKey, (old: any) =>
      old?.filter((item: any) => item.anime_id !== animeId) ?? old
    );

    updateStatusMutation.mutate(
      { userId, animeId, newStatus: 'On Hold' },
      {
        onError: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          queryClient.setQueryData(queryKey, previousData);
        },
      }
    );
  }, [userId, limit, updateStatusMutation, queryClient]);

  const handleSeriesComplete = (animeId: string) => {
    // TODO: Show rating modal and badge unlock
    console.log('[ContinueWatching] Series completed:', animeId);
    // This will be implemented when we build the completion flow
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
        </View>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
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
          <Pressable
            onPress={onSeeAll}
            style={{ paddingVertical: 12, paddingHorizontal: 4 }}
            accessibilityLabel="See all currently watching"
            accessibilityRole="button"
          >
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
              onRemove={() => handleRemove(item.anime_id)}
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
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },

  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: -0.2,
  },

  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },

  skeletonCard: {
    width: 140,
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  listContent: {
    paddingHorizontal: 20,
  },
});
