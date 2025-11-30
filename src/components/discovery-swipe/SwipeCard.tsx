import React, { useCallback, useEffect, useMemo, useState, memo, useRef } from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, Pressable, PanResponder, Animated, Dimensions } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { GenrePills } from '../common/GenrePills';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  SWIPE_THRESHOLD,
  ROTATION_FACTOR,
} from '../../styles/discoverySwipeStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [showHint, setShowHint] = useState<SwipeDirection>(null);
  const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, active: false });
  const posterSource = anime.thumbnail_url ? { uri: anime.thumbnail_url } : null;
  const hasPoster = Boolean(posterSource);

  // Animated position values
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Debug: Track when anime prop changes
  useEffect(() => {
    console.log('[SwipeCard] 🎴 Received new anime:', {
      title: anime.title,
      id: anime.id,
    });
  }, [anime.id]);

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

  // PanResponder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        console.log('🟢 [PAN] Touch detected on card!');
        return true;
      },

      onMoveShouldSetPanResponder: (_, gesture) => {
        const moved = Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2;
        if (moved) {
          console.log('🟡 [PAN] Movement detected, starting gesture');
        }
        return moved;
      },

      onPanResponderGrant: () => {
        console.log('✅ [PAN] Gesture started!');
        ReactNativeHapticFeedback.trigger('impactLight');

        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gesture) => {
        console.log('🔵 [PAN] Dragging:', {
          x: Math.round(gesture.dx),
          y: Math.round(gesture.dy),
          threshold: SWIPE_THRESHOLD,
        });

        setDebugInfo({
          x: Math.round(gesture.dx),
          y: Math.round(gesture.dy),
          active: true,
        });

        // Show directional hints
        if (Math.abs(gesture.dx) > 25) {
          setShowHint(gesture.dx < 0 ? 'skip' : 'add');
        } else if (gesture.dy > 25) {
          setShowHint('rate');
        } else {
          setShowHint(null);
        }

        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(_, gesture);

        const distance = Math.sqrt(gesture.dx ** 2 + gesture.dy ** 2);
        const newOpacity = Math.max(1 - distance / 300, 0.5);
        opacity.setValue(newOpacity);
      },

      onPanResponderRelease: (_, gesture) => {
        console.log('🔴 [PAN] Released at:', {
          dx: Math.round(gesture.dx),
          dy: Math.round(gesture.dy),
          threshold: SWIPE_THRESHOLD,
        });

        pan.flattenOffset();
        setDebugInfo({ x: 0, y: 0, active: false });
        setShowHint(null);

        if (gesture.dx < -SWIPE_THRESHOLD) {
          console.log('✅ [ACTION] SKIP triggered!');
          ReactNativeHapticFeedback.trigger('impactMedium');

          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: -500,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            onSwipe('skip');
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
          });

        } else if (gesture.dx > SWIPE_THRESHOLD) {
          console.log('✅ [ACTION] ADD triggered!');
          ReactNativeHapticFeedback.trigger('impactMedium');

          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: 500,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            onSwipe('add');
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
          });

        } else if (gesture.dy > SWIPE_THRESHOLD) {
          console.log('✅ [ACTION] RATE triggered!');
          ReactNativeHapticFeedback.trigger('impactHeavy');

          // Don't animate card away - just reset position and trigger modal
          // This keeps the card ready for re-swiping if user cancels the rating
          Animated.parallel([
            Animated.spring(pan.x, {
              toValue: 0,
              tension: 40,
              friction: 7,
              useNativeDriver: false,
            }),
            Animated.spring(pan.y, {
              toValue: 0,
              tension: 40,
              friction: 7,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Trigger rate modal after animation completes
            onSwipe('rate');
          });

        } else {
          console.log('❌ [PAN] Below threshold, returning to center');
          ReactNativeHapticFeedback.trigger('impactLight');

          Animated.parallel([
            Animated.spring(pan.x, {
              toValue: 0,
              tension: 40,
              friction: 7,
              useNativeDriver: false,
            }),
            Animated.spring(pan.y, {
              toValue: 0,
              tension: 40,
              friction: 7,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },

      onPanResponderTerminate: () => {
        console.log('⚠️ [PAN] Gesture terminated');
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        opacity.setValue(1);
        setShowHint(null);
        setDebugInfo({ x: 0, y: 0, active: false });
      },
    })
  ).current;

  // Calculate rotation based on drag
  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.cardContainer}>
      {/* Swipe hints - Minimal */}
      {showHint === 'skip' && (
        <Text style={styles.swipeHint}>Skip</Text>
      )}
      {showHint === 'rate' && (
        <Text style={[styles.swipeHint, styles.swipeHintCenter]}>Rate</Text>
      )}
      {showHint === 'add' && (
        <Text style={[styles.swipeHint, styles.swipeHintRight]}>Add</Text>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate },
            ],
            opacity,
          },
        ]}
      >
        <Pressable onPress={onPress} style={styles.cardContent}>
          {/* Poster - Clean, no overlays */}
          <View style={styles.posterContainer}>
            {hasPoster ? (
              <Image
                source={posterSource}
                style={[
                  styles.poster,
                  expanded && styles.posterExpanded,
                ]}
                resizeMode="cover"
                onLoad={() => {
                  console.log('[image] ✅ Loaded successfully:', anime.title);
                }}
                onError={(error) => {
                  console.log('[image] ❌ Error loading:', anime.title, error.nativeEvent.error);
                }}
              />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>

          {/* Content area below poster */}
          <View style={styles.contentArea}>
            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {anime.title || 'Unknown Title'}
            </Text>

            {/* Genre Pills */}
            {normalizedTags.length > 0 && (
              <View style={styles.genrePillsContainer}>
                <GenrePills tags={normalizedTags} max={3} />
              </View>
            )}

            {/* Episode count */}
            {typeof anime.episodes_count === 'number' && anime.episodes_count > 0 && (
              <Text style={styles.episodeText}>
                {anime.episodes_count} episodes
              </Text>
            )}

            {/* Tap hint */}
            {!expanded && (
              <Text style={styles.tapHint}>Tap for details</Text>
            )}
          </View>

          {/* Expanded synopsis */}
          {expanded && anime.synopsis && (
            <View style={styles.synopsisSection}>
              <Text style={styles.synopsisText} numberOfLines={5}>
                {anime.synopsis}
              </Text>
              {onNavigateToDetail && (
                <Pressable
                  onPress={onNavigateToDetail}
                  style={styles.detailsLink}
                >
                  <Text style={styles.detailsLinkText}>
                    See Full Details
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

// Memoize to prevent unnecessary re-renders
export const SwipeCard = memo(SwipeCardComponent);
SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  // Container
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // Card - Clean white, subtle shadow
  card: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',

    // Apple-style subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  cardContent: {
    width: '100%',
  },

  // Poster - Clean, no overlays
  posterContainer: {
    width: '100%',
    backgroundColor: '#F5F5F7',
  },

  poster: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.58,
    backgroundColor: '#F5F5F7',
  },

  posterExpanded: {
    height: SCREEN_HEIGHT * 0.45,
  },

  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    fontSize: 15,
    color: '#86868B',
  },

  // Content area - Generous padding
  contentArea: {
    padding: 20,
    paddingTop: 16,
  },

  // Title - SF Pro Display style
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1D1D1F',
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 6,
  },

  // Genre pills container
  genrePillsContainer: {
    marginBottom: 4,
  },

  // Episode count
  episodeText: {
    fontSize: 13,
    color: '#86868B',
    marginTop: 6,
  },

  // Tap hint
  tapHint: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 12,
  },

  // Synopsis section
  synopsisSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },

  synopsisText: {
    fontSize: 15,
    color: '#1D1D1F',
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Details link
  detailsLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },

  detailsLinkText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Swipe hints - Minimal
  swipeHint: {
    position: 'absolute',
    left: 40,
    top: '50%',
    fontSize: 20,
    fontWeight: '600',
    color: '#86868B',
    opacity: 0.6,
    zIndex: 100,
  },

  swipeHintCenter: {
    left: '50%',
    marginLeft: -30,
    top: '40%',
  },

  swipeHintRight: {
    left: undefined,
    right: 40,
  },
});
