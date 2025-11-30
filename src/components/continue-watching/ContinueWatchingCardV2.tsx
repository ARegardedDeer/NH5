import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 20;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2;
const POSTER_HEIGHT = CARD_WIDTH * 1.45;

export const ContinueWatchingCardV2: React.FC<ContinueWatchingCardV2Props> = ({
  anime,
  status,
  currentEpisode,
  totalEpisodes,
  onContinue,
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMovie = totalEpisodes === 1;
  const isCompleted = isMovie && currentEpisode >= 1;

  const progress = useMemo(() => {
    if (!totalEpisodes || totalEpisodes <= 0) return null;
    return Math.min(100, Math.max(0, (currentEpisode / totalEpisodes) * 100));
  }, [currentEpisode, totalEpisodes]);

  const episodeLabel = useMemo(() => {
    if (totalEpisodes) return `Ep ${currentEpisode} / ${totalEpisodes}`;
    return `Ep ${currentEpisode}`;
  }, [currentEpisode, totalEpisodes]);

  const ctaLabel = useMemo(() => {
    if (isMovie) {
      return isCompleted ? 'Completed' : 'Mark Complete';
    }
    return 'Update';
  }, [isMovie, isCompleted]);

  const handleInfoPress = () => {
    navigateToAnimeDetail(navigation, anime.id, anime.title);
  };

  const handleCardPress = () => {
    // Clear existing timer
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }

    // Show overlay
    setShowOverlay(true);

    // Auto-dismiss after 3 seconds
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlay(false);
    }, 3000);
  };

  const handleOverlayPress = () => {
    // Dismiss immediately on tap
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }
    setShowOverlay(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  return (
    <Pressable style={styles.card} onPress={handleCardPress}>
      <View style={styles.posterWrapper}>
        {anime.thumbnail_url ? (
          <Image
            source={{ uri: anime.thumbnail_url }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Dark overlay with info (shows on tap) */}
        {showOverlay && (
          <Pressable style={styles.overlay} onPress={handleOverlayPress}>
            <View style={styles.overlayContent}>
              <Text style={styles.overlayTitle} numberOfLines={2}>
                {anime.title}
              </Text>
              <Text style={styles.overlayEpisode}>{episodeLabel}</Text>
            </View>
          </Pressable>
        )}

        <Pressable
          style={styles.infoButton}
          onPress={(e) => {
            e.stopPropagation();
            handleInfoPress();
          }}
        >
          <Text style={styles.infoText}>i</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {progress !== null && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}

        <Pressable
          style={[styles.ctaButton, isCompleted && styles.ctaButtonDisabled]}
          onPress={(e) => {
            e.stopPropagation();
            if (!isCompleted) {
              onContinue();
            }
          }}
          disabled={isCompleted}
        >
          <Text style={[styles.ctaText, isCompleted && styles.ctaTextDisabled]}>
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  posterWrapper: {
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: POSTER_HEIGHT,
    backgroundColor: '#F5F5F7',
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#86868B',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayContent: {
    gap: 8,
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  overlayEpisode: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  infoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 10,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  ctaButton: {
    height: 42,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  ctaTextDisabled: {
    color: '#9CA3AF',
  },
});

export default ContinueWatchingCardV2;
