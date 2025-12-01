import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideOutLeft } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';

interface ActiveRowProps {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    series_id: string | null;
    series: { title: string } | null;
  };
  currentEpisode: number;
  totalEpisodes: number | null;
  status: string;
  onMenuPress: () => void;
}

export const ActiveRow: React.FC<ActiveRowProps> = ({
  anime,
  currentEpisode,
  totalEpisodes,
  status,
  onMenuPress,
}) => {
  const navigation = useNavigation<AppNavigationProp>();

  const displayTitle = anime.series?.title || anime.title;
  const isSingleEpisode = totalEpisodes === 1;

  const getSubtitle = () => {
    if (isSingleEpisode) {
      return 'Movie';
    }
    if (status === 'Rewatching') {
      return `Rewatching • Ep ${currentEpisode}${totalEpisodes ? ` / ${totalEpisodes}` : ''}`;
    }
    return `Ep ${currentEpisode}${totalEpisodes ? ` / ${totalEpisodes}` : ''}`;
  };

  const handlePress = () => {
    HapticFeedback.trigger('impactLight');
    navigation.navigate('AnimeDetail', { animeId: anime.id, title: anime.title });
  };

  const handleMenuPress = () => {
    HapticFeedback.trigger('impactLight');
    onMenuPress();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={SlideOutLeft.duration(300)}
    >
      <Pressable style={styles.row} onPress={handlePress}>
        {/* Poster */}
        <Image
          source={{ uri: anime.thumbnail_url || 'https://via.placeholder.com/50x70?text=No' }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {getSubtitle()}
          </Text>
        </View>

        {/* Menu Button */}
        <Pressable
          style={styles.menuButton}
          onPress={handleMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A2E',
  },

  poster: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: '#86868B',
  },

  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuButtonText: {
    fontSize: 20,
    color: '#86868B',
  },
});
