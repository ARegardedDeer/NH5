import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../types/navigation';
import { navigateToAnimeDetail } from '../../utils/navigationHelpers';

interface ContinueWatchingCardProps {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    season_number: number | null;
    series_id: string | null;
    series?: { title: string } | null;
  };
  currentEpisode: number;
  totalEpisodes: number | null;
  onContinue: () => void;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({
  anime,
  currentEpisode,
  totalEpisodes,
  onContinue,
}) => {
  const navigation = useNavigation<AppNavigationProp>();

  // Calculate progress percentage
  const progress = totalEpisodes ? ((currentEpisode + 1) / totalEpisodes) * 100 : 0;

  // Format episode/season text
  const formatEpisodeText = () => {
    if (anime.season_number && totalEpisodes) {
      return `S${anime.season_number}: Ep ${currentEpisode + 1}/${totalEpisodes}`;
    }
    if (totalEpisodes) {
      return `Episode ${currentEpisode + 1}/${totalEpisodes}`;
    }
    // Ongoing series (no total episodes)
    return `Episode ${currentEpisode + 1}`;
  };

  return (
    <Pressable
      style={styles.card}
      onPress={onContinue}
    >
      {/* Poster Image */}
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

      {/* Progress Bar Overlay (only if we know total episodes) */}
      {totalEpisodes && (
        <View style={styles.progressOverlay}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}

      {/* Info Section */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {anime.title}
        </Text>
        <Text style={styles.episodeText}>
          {formatEpisodeText()}
        </Text>

        {/* Continue Button */}
        <Pressable
          style={styles.continueButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent card press
            onContinue();
          }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>

        {/* View Details link */}
        <Pressable
          style={styles.detailsLink}
          onPress={(e) => {
            e.stopPropagation();
            navigateToAnimeDetail(navigation, anime.id);
          }}
        >
          <Text style={styles.detailsLinkText}>View Details →</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  poster: {
    width: '100%',
    height: 200,
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

  progressOverlay: {
    position: 'absolute',
    top: 200 - 4, // Bottom of poster
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },

  info: {
    padding: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    lineHeight: 18,
    letterSpacing: -0.2,
  },

  episodeText: {
    fontSize: 12,
    color: '#86868B',
    marginBottom: 8,
    letterSpacing: -0.1,
  },

  continueButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  detailsLink: {
    marginTop: 8,
    paddingVertical: 4,
  },

  detailsLinkText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    textAlign: 'center',
  },
});
