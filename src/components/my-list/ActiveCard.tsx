import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideOutLeft } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useButtonPress } from '../../utils/animations';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';
import { navigateToAnimeDetail } from '../../utils/navigationHelpers';

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
  onInfoPress?: () => void;
}

export const ActiveCard: React.FC<ActiveCardProps> = ({
  anime,
  currentEpisode,
  totalEpisodes,
  status,
  onUpdate,
  onInfoPress,
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const updateButtonAnim = useButtonPress();

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
    onUpdate();
  };

  const handleUpdatePress = () => {
    HapticFeedback.trigger('impactLight');
    onUpdate();
  };

  const handleInfoPress = () => {
    HapticFeedback.trigger('impactLight');
    if (onInfoPress) {
      onInfoPress();
    } else {
      navigateToAnimeDetail(navigation, anime.id, anime.title);
    }
  };

  return (
    <Animated.View
      style={styles.card}
      entering={FadeIn.duration(200)}
      exiting={SlideOutLeft.duration(300)}
    >
      <Pressable onPress={handleCardPress} style={styles.posterWrapper}>
        <Image
          source={{ uri: anime.thumbnail_url || 'https://via.placeholder.com/165x230?text=No+Image' }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        <View style={styles.overlayContent}>
          <View style={styles.infoTop}>
            <Text style={styles.title} numberOfLines={2}>
              {displayTitle}
            </Text>
            <Pressable style={styles.infoButton} onPress={handleInfoPress}>
              <Text style={styles.infoButtonText}>i</Text>
            </Pressable>
          </View>

          <Text style={styles.episodeText}>{getEpisodeText()}</Text>

          {progress !== null && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          )}

          <Animated.View style={[styles.updateButtonContainer, updateButtonAnim.animatedStyle]}>
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
              <Text style={styles.updateButtonText}>{getCtaText()}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 165,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  posterWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  poster: {
    width: 165,
    height: 230,
    backgroundColor: '#2A2A3E',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  infoButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  episodeText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  updateButtonContainer: {
    marginTop: 2,
  },
  updateButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#34C759',
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
