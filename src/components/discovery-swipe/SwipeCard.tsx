import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ImageBackground, ActivityIndicator } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import type { PanGestureHandlerEventPayload, GestureEvent } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
// import { BlurView } from '@react-native-community/blur'; // Temporarily disabled for performance
import { GenrePills } from '../common/GenrePills';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  SWIPE_THRESHOLD,
  ROTATION_FACTOR,
} from '../../styles/discoverySwipeStyles';

interface AnimeCard {
  id: string;
  title: string;
  thumbnail_url: string | null;
  synopsis: string | null;
  tags: string[] | null;
  episodes_count?: number | null;
}

interface SwipeCardProps {
  anime: AnimeCard;
  expanded: boolean;
  onSwipe: (action: 'skip' | 'rate' | 'add') => void;
  onPress?: () => void;
  onNavigateToDetail?: () => void;
}

type SwipeDirection = 'skip' | 'rate' | 'add' | null;

const SwipeCardComponent = ({ anime, expanded, onSwipe, onPress, onNavigateToDetail }: SwipeCardProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [showHint, setShowHint] = useState<SwipeDirection>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const posterSource = anime.thumbnail_url ? { uri: anime.thumbnail_url } : null;
  const hasPoster = Boolean(posterSource);

  const normalizedTags = useMemo(() => {
    const results: string[] = [];

    const splitTokens = (value: string) =>
      value
        .split(/[;,|/]/g)
        .map((token) => token.trim())
        .filter(Boolean);

    const pushMany = (input: unknown): void => {
      if (!input) return;
      if (Array.isArray(input)) {
        input.forEach(pushMany);
        return;
      }
      if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) return;

        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            pushMany(parsed);
            return;
          }
        } catch {
          // parsed as plain string; carry on
        }

        if (/[;,|/]/.test(trimmed)) {
          splitTokens(trimmed).forEach(pushMany);
          return;
        }

        results.push(trimmed);
        return;
      }

      if (typeof input === 'object') {
        const candidate =
          (input as any)?.tags ??
          (input as any)?.list ??
          Object.values(input as Record<string, unknown>);
        pushMany(candidate);
      }
    };

    pushMany(anime.tags);

    return Array.from(new Set(results.map((tag) => tag.trim()).filter(Boolean))).slice(0, 3);
  }, [anime.tags]);

  useEffect(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, [anime.id, translateX, translateY]);

  const triggerHaptic = () => {
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const determineSwipeDirection = (x: number, y: number): SwipeDirection => {
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    if (absY > absX && y > SWIPE_THRESHOLD) {
      return 'rate';
    }

    if (absX > absY) {
      if (x < -SWIPE_THRESHOLD) return 'skip';
      if (x > SWIPE_THRESHOLD) return 'add';
    }

    return null;
  };

  const updateHint = useCallback((value: SwipeDirection) => {
    setShowHint(value);
  }, []);

  const animateSwipeOut = (direction: SwipeDirection) => {
    'worklet';
    if (direction === 'skip') {
      translateX.value = withTiming(-CARD_WIDTH * 1.5, { duration: 300 });
    } else if (direction === 'add') {
      translateX.value = withTiming(CARD_WIDTH * 1.5, { duration: 300 });
    } else if (direction === 'rate') {
      translateY.value = withTiming(CARD_HEIGHT * 1.5, { duration: 300 });
    }
  };

  const gestureHandler = (event: GestureEvent<PanGestureHandlerEventPayload>) => {
    'worklet';
    const { translationX, translationY, state } = event.nativeEvent;

    if (state === 2) {
      translateX.value = translationX;
      translateY.value = translationY;

      const absX = Math.abs(translateX.value);
      const absY = Math.abs(translateY.value);
      if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
        runOnJS(triggerHaptic)();
      }

      const hint = determineSwipeDirection(translateX.value, translateY.value);
      runOnJS(updateHint)(hint);
    } else if (state === 5) {
      runOnJS(updateHint)(null);
      const direction = determineSwipeDirection(translateX.value, translateY.value);

      if (direction) {
        runOnJS(triggerHaptic)();
        animateSwipeOut(direction);
        runOnJS(onSwipe)(direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(
      translateX.value,
      [-CARD_WIDTH, CARD_WIDTH],
      [-25, 25]
    );

    const opacity = interpolate(
      Math.abs(translateX.value) + Math.abs(translateY.value),
      [0, SWIPE_THRESHOLD * 2],
      [1, 0.5]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotateZ * ROTATION_FACTOR}deg` },
      ],
      opacity,
    };
  });

  return (
    <View style={styles.cardContainer}>
      {showHint === 'skip' && (
        <Text style={[styles.swipeHint, styles.swipeHintLeft]}>
          👋 SKIP
        </Text>
      )}
      {showHint === 'rate' && (
        <Text style={[styles.swipeHint, styles.swipeHintDown]}>
          ⭐ RATE
        </Text>
      )}
      {showHint === 'add' && (
        <Text style={[styles.swipeHint, styles.swipeHintRight]}>
          ADD ➕
        </Text>
      )}

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.wrapper, animatedCardStyle]}>
          {/* Blurred Background Layer - Simplified for performance */}
          {hasPoster && (
            <View style={styles.cardBackdrop}>
              <ImageBackground
                source={posterSource}
                style={styles.blurredBackground}
                blurRadius={25}
                resizeMode="cover"
              >
                <View style={styles.darkOverlay} />
              </ImageBackground>
            </View>
          )}

          {/* Content Card */}
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            {hasPoster ? (
              <ImageBackground
                source={posterSource}
                style={styles.photo}
                imageStyle={styles.photoImage}
              >
                <View style={styles.photoOverlay} />
                {normalizedTags.length > 0 && (
                  <View style={styles.genrePillsOverlay}>
                    <GenrePills tags={normalizedTags} max={3} />
                  </View>
                )}
                <View style={styles.photoFooter}>
                  <Text style={styles.photoTitle} numberOfLines={2}>
                    {anime.title || 'Unknown Title'}
                  </Text>
                  {typeof anime.episodes_count === 'number' && anime.episodes_count > 0 && (
                    <Text style={styles.photoSubtitle}>
                      {anime.episodes_count} episodes
                    </Text>
                  )}
                </View>
                {imageLoading && (
                  <View style={styles.posterSkeleton}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                  </View>
                )}
                <Image
                  source={posterSource}
                  style={{ width: 0, height: 0 }}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              </ImageBackground>
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Text style={styles.photoFallbackText}>No Image</Text>
              </View>
            )}

            <View style={styles.metaSection}>
              {expanded && anime.synopsis && (
                <View style={styles.synopsisContainer}>
                  <Text style={styles.synopsisLabel}>Synopsis</Text>
                  <Text style={styles.synopsisText} numberOfLines={6}>
                    {anime.synopsis}
                  </Text>
                  {onNavigateToDetail && (
                    <Text
                      onPress={onNavigateToDetail}
                      style={styles.seeMoreText}
                    >
                      See full details →
                    </Text>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Memoize to prevent unnecessary re-renders
export const SwipeCard = memo(SwipeCardComponent);
SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  swipeHint: {
    position: 'absolute',
    top: -28,
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E7FF',
    letterSpacing: 1,
  },
  swipeHintLeft: {
    left: 32,
  },
  swipeHintRight: {
    right: 32,
  },
  swipeHintDown: {
    top: undefined,
    bottom: -28,
  },
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  // Blurred background layer
  cardBackdrop: {
    position: 'absolute',
    width: '88%',
    maxWidth: 380,
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
  },
  blurredBackground: {
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  card: {
    width: '88%',
    maxWidth: 380,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  photo: {
    width: '100%',
    aspectRatio: 0.72,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  photoImage: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  genrePillsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    zIndex: 10,
  },
  photoFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  photoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  photoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoFallbackText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  posterSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaSection: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  genresRow: {
    marginBottom: 12,
  },
  synopsisContainer: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  synopsisLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  synopsisText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },
  seeMoreText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
