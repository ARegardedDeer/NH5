import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useButtonPress } from '../../utils/animations';
import HapticFeedback from 'react-native-haptic-feedback';

interface SearchResultRowProps {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    tags: string[] | null;
  };
  onSave: () => void;
  onStart: () => void;
  isAdding?: boolean;
}

export const SearchResultRow: React.FC<SearchResultRowProps> = ({
  anime,
  onSave,
  onStart,
  isAdding = false,
}) => {
  const saveAnim = useButtonPress();
  const startAnim = useButtonPress();

  const genres = anime.tags?.slice(0, 3).join(', ') || 'Unknown';

  const handleSave = () => {
    HapticFeedback.trigger('impactLight');
    onSave();
  };

  const handleStart = () => {
    HapticFeedback.trigger('impactLight');
    onStart();
  };

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(200)}
    >
      <Image
        source={{ uri: anime.thumbnail_url || 'https://via.placeholder.com/60x85?text=No+Image' }}
        style={styles.poster}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {anime.title}
        </Text>
        <Text style={styles.genres} numberOfLines={1}>
          {genres}
        </Text>

        <View style={styles.actions}>
          <Animated.View style={[styles.buttonContainer, saveAnim.animatedStyle]}>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              onPressIn={saveAnim.onPressIn}
              onPressOut={saveAnim.onPressOut}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.buttonContainer, startAnim.animatedStyle]}>
            <Pressable
              style={[styles.button, styles.startButton]}
              onPress={handleStart}
              onPressIn={startAnim.onPressIn}
              onPressOut={startAnim.onPressOut}
              disabled={isAdding}
            >
              <Text style={styles.buttonText}>Start</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  poster: {
    width: 60,
    height: 85,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  genres: {
    fontSize: 13,
    color: '#86868B',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  saveButton: {
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  startButton: {
    backgroundColor: '#7C3AED',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
