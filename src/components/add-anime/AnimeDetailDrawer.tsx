import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useButtonPress } from '../../utils/animations';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';

interface AnimeDetailDrawerProps {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    genres: string[] | null;
    synopsis: string | null;
    episodes_count: number | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToBacklog: () => void;
  isAdded?: boolean; // Track if anime is already added
}

// Process genres to ensure they're separated
const processGenres = (genres: string[] | null): string[] => {
  if (!genres || genres.length === 0) return [];

  // Flatten array and split any comma-separated values
  return genres
    .flatMap(genre => {
      // If genre contains commas, split it
      if (typeof genre === 'string' && genre.includes(',')) {
        return genre.split(',').map(g => g.trim());
      }
      return genre;
    })
    .filter(g => g && g.length > 0) // Remove empty strings
    .slice(0, 5); // Limit to 5 genres
};

export const AnimeDetailDrawer = React.forwardRef<BottomSheet, AnimeDetailDrawerProps>(
  ({ anime, isOpen, onClose, onAddToBacklog, isAdded = false }, ref) => {
    const navigation = useNavigation<AppNavigationProp>();
    const detailsAnim = useButtonPress();
    const addAnim = useButtonPress();
    const [localIsAdded, setLocalIsAdded] = useState(isAdded);

    // Reset state when drawer opens with new anime
    useEffect(() => {
      setLocalIsAdded(isAdded);
    }, [anime?.id, isAdded]);

    if (!anime) return null;

    // Process genres to ensure they're separated
    const cleanGenres = processGenres(anime.genres);

    const handleViewDetails = () => {
      HapticFeedback.trigger('impactLight');
      navigation.navigate('AnimeDetail', { animeId: anime.id });
      onClose();
    };

    const handleAddToBacklog = () => {
      HapticFeedback.trigger('impactLight');
      setLocalIsAdded(true); // Set local state immediately for instant feedback
      onAddToBacklog();
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['90%']}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetScrollView style={styles.content}>
          {/* Close Button */}
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          {/* Large Poster */}
          <Image
            source={{
              uri: anime.thumbnail_url || 'https://via.placeholder.com/200x280?text=No+Image'
            }}
            style={styles.poster}
            resizeMode="cover"
          />

          {/* Title */}
          <Text style={styles.title}>{anime.title}</Text>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              {anime.episodes_count
                ? `${anime.episodes_count} episode${anime.episodes_count > 1 ? 's' : ''}`
                : 'Episodes TBA'}
            </Text>
          </View>

          {/* Genre Pills */}
          {cleanGenres.length > 0 && (
            <View style={styles.genreContainer}>
              {cleanGenres.map((genre, index) => (
                <View key={`${genre}-${index}`} style={styles.genrePill}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Synopsis */}
          {anime.synopsis && (
            <View style={styles.synopsisContainer}>
              <Text style={styles.synopsisLabel}>Synopsis</Text>
              <Text style={styles.synopsisText} numberOfLines={4}>
                {anime.synopsis}
              </Text>
            </View>
          )}

          {/* CTAs */}
          <View style={styles.ctaContainer}>
            {/* View Details (Left) */}
            <Animated.View style={[styles.ctaButton, detailsAnim.animatedStyle]}>
              <Pressable
                style={[styles.button, styles.detailsButton]}
                onPress={handleViewDetails}
                onPressIn={detailsAnim.onPressIn}
                onPressOut={detailsAnim.onPressOut}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
              </Pressable>
            </Animated.View>

            {/* Add to Backlog (Right) */}
            <Animated.View style={[styles.ctaButton, addAnim.animatedStyle]}>
              <Pressable
                style={[
                  styles.button,
                  localIsAdded ? styles.addedButton : styles.addButton
                ]}
                onPress={handleAddToBacklog}
                onPressIn={!localIsAdded ? addAnim.onPressIn : undefined}
                onPressOut={!localIsAdded ? addAnim.onPressOut : undefined}
                disabled={localIsAdded}
              >
                <Text style={localIsAdded ? styles.addedButtonText : styles.addButtonText}>
                  {localIsAdded ? '✓ Added!' : 'Add to Backlog'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#1A1A2E',
  },

  indicator: {
    backgroundColor: '#86868B',
    width: 40,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  closeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  poster: {
    width: 200,
    height: 280,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#2A2A3E',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },

  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },

  metadataText: {
    fontSize: 14,
    color: '#86868B',
  },

  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },

  genrePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },

  genreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },

  synopsisContainer: {
    marginBottom: 24,
  },

  synopsisLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  synopsisText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#86868B',
  },

  ctaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  ctaButton: {
    flex: 1,
  },

  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },

  detailsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },

  addButton: {
    backgroundColor: '#7C3AED',
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  addedButton: {
    backgroundColor: '#4CAF50', // Green background
  },

  addedButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
