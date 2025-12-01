import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideOutLeft } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useButtonPress } from '../../utils/animations';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';

interface ActiveCardProps {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    series_id: string | null;
    season_number: number | null;
    series: { title: string } | null;
    episodes_count: number | null;
  };
  currentEpisode: number;
  totalEpisodes: number | null;
  status: string;
  onUpdate: () => void;
  onMenuPress: () => void;
}

export const ActiveCard: React.FC<ActiveCardProps> = ({
  anime,
  currentEpisode,
  totalEpisodes,
  status,
  onUpdate,
  onMenuPress,
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const updateButtonAnim = useButtonPress();
  const menuButtonAnim = useButtonPress();

  // Display title (series name if multi-season)
  const displayTitle = anime.series?.title || anime.title;

  // Calculate progress
  const progress = totalEpisodes
    ? Math.round((currentEpisode / totalEpisodes) * 100)
    : null;

  // Single episode check (movies/OVAs)
  const isSingleEpisode = totalEpisodes === 1;
  const isCompleted = status === 'Completed';

  // Format episode text
  const getEpisodeText = () => {
    if (isSingleEpisode) {
      return 'Movie';
    }
    return totalEpisodes ? `Ep ${currentEpisode} / ${totalEpisodes}` : `Episode ${currentEpisode}`;
  };

  // CTA text
  const getCtaText = () => {
    if (isSingleEpisode) {
      return isCompleted ? '✓ Watched' : 'Watch';
    }
    return 'Update';
  };

  const handleCardPress = () => {
    HapticFeedback.trigger('impactLight');
    navigation.navigate('AnimeDetail', { animeId: anime.id, title: anime.title });
  };

  const handleUpdatePress = () => {
    HapticFeedback.trigger('impactLight');
    onUpdate();
  };

  const handleMenuPress = () => {
    HapticFeedback.trigger('impactLight');
    onMenuPress();
  };

  return (
    <Animated.View
      style={styles.card}
      entering={FadeIn.duration(200)}
      exiting={SlideOutLeft.duration(300)}
    >
      {/* Poster - Tappable */}
      <Pressable onPress={handleCardPress}>
        <Image
          source={{ uri: anime.thumbnail_url || 'https://via.placeholder.com/165x230?text=No+Image' }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Progress Bar Overlay */}
        {progress !== null && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        )}
      </Pressable>

      {/* Info Section */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {displayTitle}
        </Text>

        <Text style={styles.episodeText}>
          {getEpisodeText()}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Update Button */}
          <Animated.View
            style={[styles.updateButtonContainer, updateButtonAnim.animatedStyle]}
          >
            <Pressable
              style={[
                styles.updateButton,
                isSingleEpisode && isCompleted && styles.updateButtonDisabled
              ]}
              onPress={handleUpdatePress}
              onPressIn={updateButtonAnim.onPressIn}
              onPressOut={updateButtonAnim.onPressOut}
              disabled={isSingleEpisode && isCompleted}
            >
              <Text style={styles.updateButtonText}>
                {getCtaText()}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Menu Button */}
          <Animated.View style={menuButtonAnim.animatedStyle}>
            <Pressable
              style={styles.menuButton}
              onPress={handleMenuPress}
              onPressIn={menuButtonAnim.onPressIn}
              onPressOut={menuButtonAnim.onPressOut}
            >
              <Text style={styles.menuButtonText}>⋮</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 165,
    marginBottom: 20,
  },

  poster: {
    width: 165,
    height: 230,
    borderRadius: 12,
    backgroundColor: '#2A2A3E',
  },

  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },

  info: {
    marginTop: 8,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },

  episodeText: {
    fontSize: 12,
    color: '#86868B',
    marginBottom: 8,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },

  updateButtonContainer: {
    flex: 1,
  },

  updateButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  updateButtonDisabled: {
    backgroundColor: '#4CAF50',
    opacity: 0.7,
  },

  updateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
