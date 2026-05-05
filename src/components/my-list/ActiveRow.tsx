import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideOutLeft } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';
import { navigateToAnimeDetail } from '../../utils/navigationHelpers';

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
  onUpdatePress: () => void;
  onInfoPress: () => void;
}

export const ActiveRow: React.FC<ActiveRowProps> = ({
  anime,
  currentEpisode,
  totalEpisodes,
  status,
  onUpdatePress,
  onInfoPress,
}) => {
  const navigation = useNavigation<AppNavigationProp>();

  const displayTitle = anime.series?.title || anime.title;
  const isSingleEpisode = totalEpisodes === 1;

  const getSubtitle = () => {
    if (isSingleEpisode) {
      return 'Movie';
    }
    if (status === 'Rewatching') {
      return `Rewatching • Ep ${currentEpisode + 1}${totalEpisodes ? ` / ${totalEpisodes}` : ''}`;
    }
    return `Ep ${currentEpisode + 1}${totalEpisodes ? ` / ${totalEpisodes}` : ''}`;
  };

  const handlePress = () => {
    HapticFeedback.trigger('impactLight');
    onUpdatePress();
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

        {/* Update Chip */}
        <Pressable style={styles.updateChip} onPress={handlePress}>
          <Text style={styles.updateChipText}>Update</Text>
        </Pressable>

        {/* Info Button */}
        <Pressable
          style={styles.infoButton}
          onPress={handleInfoPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.infoButtonText}>i</Text>
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

  updateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
    marginRight: 8,
  },
  updateChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
