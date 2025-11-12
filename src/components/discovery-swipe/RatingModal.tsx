import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { currentTheme, borderRadius } from '../../styles/discoverySwipeStyles';

interface Anime {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

interface RatingModalProps {
  anime: Anime;
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
}

export function RatingModal({
  anime,
  visible,
  onClose,
  onSubmit,
}: RatingModalProps) {
  const [rating, setRating] = useState(7.0);

  const getEmoji = (value: number) => {
    if (value <= 3) return '😐';
    if (value <= 5) return '😊';
    if (value <= 7) return '😄';
    if (value <= 9) return '😍';
    return '🤩';
  };

  const handleSubmit = () => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    onSubmit(rating);
  };

  const handleValueChange = (value: number) => {
    setRating(value);
    ReactNativeHapticFeedback.trigger('selection', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      >
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          {anime.thumbnail_url && (
            <Image
              source={{ uri: anime.thumbnail_url }}
              style={styles.poster}
              resizeMode="cover"
            />
          )}

          <Text style={styles.title} numberOfLines={2}>
            {anime.title}
          </Text>

          <View style={styles.ratingDisplay}>
            <Text style={styles.emoji}>{getEmoji(rating)}</Text>
            <Text style={styles.ratingText}>
              ⭐ {rating.toFixed(1)} / 10
            </Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={0.5}
            value={rating}
            onValueChange={handleValueChange}
            minimumTrackTintColor={currentTheme.primary}
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor={currentTheme.primary}
          />

          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>1</Text>
            <Text style={styles.scaleLabel}>5</Text>
            <Text style={styles.scaleLabel}>10</Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: currentTheme.card,
    borderRadius: borderRadius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  poster: {
    width: 120,
    height: 170,
    borderRadius: borderRadius.md,
    marginBottom: 16,
    backgroundColor: currentTheme.muted,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: currentTheme.foreground,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  ratingDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 24,
    fontWeight: '700',
    color: currentTheme.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  scaleLabel: {
    fontSize: 14,
    color: currentTheme.mutedForeground,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: currentTheme.muted,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: currentTheme.mutedForeground,
  },
  submitButton: {
    backgroundColor: currentTheme.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: currentTheme.primaryForeground,
  },
});
