import React, { useState } from 'react';
import { Text, Pressable, Image, StyleSheet, ActionSheetIOS, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
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
  onRemove?: () => void;
}

export const ContinueWatchingCardV2: React.FC<ContinueWatchingCardV2Props> = ({
  anime,
  currentEpisode,
  status,
  onContinue,
  onRemove,
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const [imageError, setImageError] = useState(false);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const displayTitle = anime.series?.title || anime.title;
  const isCompleted = status === 'Completed';

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (isCompleted) return;
    HapticFeedback.trigger('impactLight');
    onContinue();
  };

  const triggerRemove = () => {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 }, () => {
      if (onRemove) runOnJS(onRemove)();
    });
  };

  const handleLongPress = () => {
    HapticFeedback.trigger('impactMedium');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Remove from Continue Watching', 'View Anime Details', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            triggerRemove();
          } else if (buttonIndex === 1) {
            navigateToAnimeDetail(navigation, anime.id, anime.title);
          }
        }
      );
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && !isCompleted && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={isCompleted}
        accessibilityLabel={`${displayTitle}, episode ${currentEpisode}`}
        accessibilityRole="button"
      >
        {/* Poster */}
        <Image
          source={{
            uri: imageError
              ? 'https://via.placeholder.com/140x200/1D1D1F/86868B?text=No+Image'
              : anime.thumbnail_url || undefined,
          }}
          style={styles.poster}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
          locations={[0.2, 1]}
          style={styles.gradientOverlay}
        >
          <Text style={styles.title} numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text style={styles.episode}>
            Ep {currentEpisode}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e1230',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  poster: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  episode: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ContinueWatchingCardV2;
