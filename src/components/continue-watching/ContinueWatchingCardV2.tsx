import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';
import { navigateToAnimeDetail } from '../../utils/navigationHelpers';

interface ContinueWatchingCardV2Props {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    season_number: number | null;
    series_id: string | null;
    series?: { title: string } | null;
  };
  status: string;
  currentEpisode: number;
  totalEpisodes: number | null;
  onContinue: () => void;
}

export const ContinueWatchingCardV2: React.FC<ContinueWatchingCardV2Props> = ({
  anime,
  currentEpisode,
  totalEpisodes,
  status,
  onContinue,
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const [imageError, setImageError] = useState(false);

  // Display title (series name if multi-season)
  const displayTitle = anime.series?.title || anime.title;

  // Calculate progress
  const progress = totalEpisodes
    ? Math.round((currentEpisode / totalEpisodes) * 100)
    : null;

  // Single episode check (movies/OVAs)
  const isSingleEpisode = totalEpisodes === 1;
  const isCompleted = status === 'Completed';

  // Progress text
  const getProgressText = () => {
    if (isSingleEpisode) {
      return isCompleted ? 'Watched' : 'Movie';
    }

    if (totalEpisodes) {
      return `Ep ${currentEpisode} • ${progress}%`;
    }

    return `Episode ${currentEpisode}`;
  };

  // Action text
  const getActionText = () => {
    if (isSingleEpisode) {
      return isCompleted ? '✓ Watched' : '▶ Watch';
    }
    return '▶ Continue';
  };

  const handlePress = () => {
    if (isSingleEpisode && isCompleted) return;
    HapticFeedback.trigger('impactLight');
    onContinue();
  };

  const handleInfoPress = (e: any) => {
    e.stopPropagation();
    HapticFeedback.trigger('impactLight');
    navigateToAnimeDetail(navigation, anime.id, anime.title);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && !isCompleted && { opacity: 0.85, transform: [{ scale: 0.98 }] }
      ]}
      onPress={handlePress}
      disabled={isSingleEpisode && isCompleted}
      accessibilityLabel={`${displayTitle}, episode ${currentEpisode}`}
      accessibilityRole="button"
    >
      {/* Poster */}
      <Image
        source={{
          uri: imageError
            ? 'https://via.placeholder.com/140x200/1D1D1F/86868B?text=No+Image'
            : anime.thumbnail_url || undefined
        }}
        style={styles.poster}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />

      {/* Info Button (top right) */}
      <Pressable
        style={styles.infoButton}
        onPress={handleInfoPress}
        hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
        accessibilityLabel={`More info about ${displayTitle}`}
        accessibilityRole="button"
      >
        <Text style={styles.infoIcon}>ⓘ</Text>
      </Pressable>

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradientOverlay}
      >
        <View style={styles.infoContainer}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>

          {/* Progress */}
          <Text style={styles.progress}>
            {getProgressText()}
          </Text>

          {/* Action */}
          <Text
            style={[
              styles.action,
              isSingleEpisode && isCompleted && styles.actionCompleted
            ]}
          >
            {getActionText()}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  poster: {
    width: '100%',
    height: '100%',
  },

  infoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },

  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  infoContainer: {
    gap: 2,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },

  progress: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 2,
  },

  action: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
    marginTop: 4,
  },

  actionCompleted: {
    color: '#34C759',
  },
});

export default ContinueWatchingCardV2;
