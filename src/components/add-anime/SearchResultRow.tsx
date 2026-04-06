import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useButtonPress } from '../../utils/animations';
import HapticFeedback from 'react-native-haptic-feedback';

interface SearchResultRowProps {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    genres: string[] | null;
  };
  onPress: () => void; // Tap row → show drawer
  onQuickAdd: () => Promise<void>; // Tap + → quick add
}

export const SearchResultRow: React.FC<SearchResultRowProps> = ({
  anime,
  onPress,
  onQuickAdd,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const addAnim = useButtonPress();

  const genres = anime.genres?.slice(0, 2).join(', ') || 'Unknown';

  const handleRowPress = () => {
    HapticFeedback.trigger('impactLight');
    onPress();
  };

  const handleQuickAdd = async (e: any) => {
    e.stopPropagation(); // Prevent row press
    HapticFeedback.trigger('impactMedium');

    try {
      await onQuickAdd();
      setIsAdded(true);
    } catch (error) {
      console.error('[SearchResultRow] Add failed:', error);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={handleRowPress}
    >
      <Animated.View
        style={styles.row}
        entering={FadeIn.duration(200)}
      >
        {/* Poster */}
        <Image
          source={{
            uri: anime.thumbnail_url || 'https://via.placeholder.com/50x70?text=No'
          }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {anime.title}
          </Text>
          <Text style={styles.genres} numberOfLines={1}>
            {genres}
          </Text>
        </View>

        {/* Quick Add Icon */}
        <Animated.View style={addAnim.animatedStyle}>
          <Pressable
            style={[
              styles.addIcon,
              isAdded && styles.addIconAdded,
            ]}
            onPress={handleQuickAdd}
            onPressIn={addAnim.onPressIn}
            onPressOut={addAnim.onPressOut}
            disabled={isAdded}
          >
            <Text style={styles.addIconText}>
              {isAdded ? '✓' : '+'}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },

  containerPressed: {
    backgroundColor: '#2A2A3E',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    marginRight: 12,
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
  },

  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addIconAdded: {
    backgroundColor: '#34C759',
  },

  addIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
