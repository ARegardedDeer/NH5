import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useButtonPress } from '../../utils/animations';
import HapticFeedback from 'react-native-haptic-feedback';

interface AnimeActionModalProps {
  visible: boolean;
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    genres: string[] | null;
    synopsis: string | null;
  } | null;
  onClose: () => void;
  onSave: () => void;
  onStart: () => void;
  isAdding?: boolean;
}

/**
 * Modal that appears when selecting an anime from search dropdown.
 * Shows anime details with Save/Start actions.
 */
export const AnimeActionModal: React.FC<AnimeActionModalProps> = ({
  visible,
  anime,
  onClose,
  onSave,
  onStart,
  isAdding = false,
}) => {
  const saveAnim = useButtonPress();
  const startAnim = useButtonPress();

  if (!anime) return null;

  const genres = anime.genres?.slice(0, 3).join(', ') || 'Unknown';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={styles.modalContainer}
          entering={FadeIn.duration(200)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modal}>
              {/* Close button */}
              <Pressable
                onPress={() => {
                  HapticFeedback.trigger('impactLight');
                  onClose();
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>

              {/* Anime thumbnail */}
              <Image
                source={{
                  uri: anime.thumbnail_url || 'https://via.placeholder.com/120x170?text=No+Image',
                }}
                style={styles.poster}
                resizeMode="cover"
              />

              {/* Title */}
              <Text style={styles.title}>{anime.title}</Text>

              {/* Genres */}
              <Text style={styles.genres}>{genres}</Text>

              {/* Synopsis */}
              {anime.synopsis && (
                <Text style={styles.synopsis} numberOfLines={4}>
                  {anime.synopsis}
                </Text>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <Animated.View style={[styles.buttonContainer, saveAnim.animatedStyle]}>
                  <Pressable
                    style={[styles.button, styles.saveButton]}
                    onPress={() => {
                      HapticFeedback.trigger('impactLight');
                      onSave();
                    }}
                    onPressIn={saveAnim.onPressIn}
                    onPressOut={saveAnim.onPressOut}
                    disabled={isAdding}
                  >
                    <Text style={styles.buttonText}>Save to Backlog</Text>
                  </Pressable>
                </Animated.View>

                <Animated.View style={[styles.buttonContainer, startAnim.animatedStyle]}>
                  <Pressable
                    style={[styles.button, styles.startButton]}
                    onPress={() => {
                      HapticFeedback.trigger('impactLight');
                      onStart();
                    }}
                    onPressIn={startAnim.onPressIn}
                    onPressOut={startAnim.onPressOut}
                    disabled={isAdding}
                  >
                    <Text style={styles.buttonText}>Start Watching</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#86868B',
  },
  poster: {
    width: 120,
    height: 170,
    borderRadius: 12,
    backgroundColor: '#2A2A3E',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  genres: {
    fontSize: 14,
    color: '#86868B',
    textAlign: 'center',
    marginBottom: 12,
  },
  synopsis: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
