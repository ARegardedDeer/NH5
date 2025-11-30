import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import HapticFeedback from 'react-native-haptic-feedback';
import { useEpisodeUpdate } from '../../hooks/useEpisodeUpdate';

interface EpisodePickerModalProps {
  visible: boolean;
  onClose: () => void;
  animeId: string;
  animeTitle: string;
  currentEpisode: number;
  totalEpisodes: number | null;
  hasSpecials: boolean;
  userId: string;
  onComplete?: (animeId: string) => void;
}

export const EpisodePickerModal: React.FC<EpisodePickerModalProps> = (props) => {
  const {
    visible,
    onClose,
    animeId,
    animeTitle,
    currentEpisode,
    totalEpisodes,
    hasSpecials,
    userId,
    onComplete,
  } = props;
  const updateEpisode = useEpisodeUpdate();
  const [selectedEpisode, setSelectedEpisode] = useState<number>(currentEpisode);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineEpisode, setInlineEpisode] = useState(currentEpisode.toString());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isSingleEpisode = totalEpisodes === 1;

  useEffect(() => {
    if (visible) {
      setSelectedEpisode(currentEpisode);
      setInlineEpisode(currentEpisode.toString());
      setIsEditingInline(false);
      setHasUnsavedChanges(false);
    }
  }, [visible, currentEpisode]);

  const availableEpisodes = useMemo(() => {
    const maxEpisode = totalEpisodes || 999;
    const episodes: number[] = [];

    for (let i = 1; i <= maxEpisode; i++) {
      episodes.push(i);
      if (hasSpecials && i < maxEpisode) {
        episodes.push(i + 0.5);
      }
    }

    return episodes;
  }, [hasSpecials, totalEpisodes]);

  const isBigJump = (targetEpisode: number) => targetEpisode - currentEpisode > 10;

  const formatEpisodeLabel = (episode: number) =>
    Number.isInteger(episode) ? `Episode ${episode}` : `Episode ${episode} (Special)`;

  const handleEditToggle = () => {
    if (isEditingInline) {
      // Done editing - validate and apply changes
      const parsed = parseInt(inlineEpisode);
      if (!isNaN(parsed) && parsed >= 1) {
        const validEpisode = totalEpisodes && parsed > totalEpisodes ? totalEpisodes : parsed;
        setSelectedEpisode(validEpisode);
        setInlineEpisode(validEpisode.toString());
      } else {
        // Invalid input - reset to current
        setInlineEpisode(currentEpisode.toString());
      }
      setIsEditingInline(false);
    } else {
      // Start editing
      setInlineEpisode(selectedEpisode.toString());
      setIsEditingInline(true);
    }
    HapticFeedback.trigger('impactLight');
  };

  const handleInlineBlur = () => {
    // Validate on blur
    const parsed = parseInt(inlineEpisode);
    if (isNaN(parsed) || parsed < 1) {
      setInlineEpisode(selectedEpisode.toString());
    } else if (totalEpisodes && parsed > totalEpisodes) {
      setInlineEpisode(totalEpisodes.toString());
    }
  };

  const performUpdate = (episodeToSet: number) => {
    updateEpisode.mutate(
      {
        animeId,
        newEpisode: episodeToSet,
        currentEpisode,
        totalEpisodes,
        userId,
      },
      {
        onSuccess: (data) => {
          setHasUnsavedChanges(false);
          if (data.isComplete) {
            onComplete?.(animeId);
          }
          onClose();
        },
      },
    );
  };

  const handleMarkWatched = () => {
    // For single-episode anime, mark as watched (episode 1)
    performUpdate(1);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved episode changes. Discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setHasUnsavedChanges(false);
              setSelectedEpisode(currentEpisode);
              setInlineEpisode(currentEpisode.toString());
              setIsEditingInline(false);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleConfirm = () => {
    // Use inline episode if currently editing, otherwise use selected
    const episodeToConfirm = isEditingInline ? parseInt(inlineEpisode) : selectedEpisode;

    if (Number.isNaN(episodeToConfirm) || episodeToConfirm < 1) {
      Alert.alert('Invalid Episode', 'Please enter a valid episode number.');
      return;
    }

    if (totalEpisodes && episodeToConfirm > totalEpisodes) {
      Alert.alert(
        'Episode Out of Range',
        `This anime has ${totalEpisodes} episodes. Please enter a number between 1 and ${totalEpisodes}.`,
      );
      return;
    }

    if (isBigJump(episodeToConfirm)) {
      Alert.alert(
        'Jump Ahead?',
        `You're jumping from Episode ${currentEpisode} to Episode ${episodeToConfirm}.\n\nThis will mark episodes 1-${episodeToConfirm} as watched.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => performUpdate(episodeToConfirm) },
        ],
      );
      return;
    }

    performUpdate(episodeToConfirm);
  };

  // Calculate progress percentage
  const progressPercentage = totalEpisodes ? Math.min((currentEpisode / totalEpisodes) * 100, 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.modalContent}>
          {/* Drag Handle (iOS standard) */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isSingleEpisode ? 'Mark as Watched' : 'Update Progress'}
            </Text>
            <Text style={styles.animeTitle} numberOfLines={1}>
              {animeTitle}
            </Text>
          </View>

          {isSingleEpisode ? (
            /* Simplified UI for movies/OVAs */
            <>
              <Text style={styles.singleEpisodePrompt}>
                Ready to mark this as watched?
              </Text>

              <Pressable
                style={styles.markWatchedButton}
                onPress={handleMarkWatched}
                disabled={updateEpisode.isPending}
              >
                <Text style={styles.markWatchedButtonText}>
                  {updateEpisode.isPending ? 'Updating...' : '✓ Mark as Watched'}
                </Text>
              </Pressable>

              <Pressable style={styles.simpleCancelButton} onPress={handleClose}>
                <Text style={styles.simpleCancelButtonText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            /* Regular UI for series */
            <>
              {/* Current Episode - Inline Editable */}
              <View style={styles.currentProgress}>
            <Text style={styles.currentLabel}>Current Episode:</Text>

            <View style={styles.episodeInputContainer}>
              {isEditingInline ? (
                <TextInput
                  style={[
                    styles.inlineEpisodeInput,
                    hasUnsavedChanges && styles.inlineEpisodeInputModified,
                  ]}
                  value={inlineEpisode}
                  onChangeText={(value) => {
                    setInlineEpisode(value);
                    const parsed = parseInt(value);
                    setHasUnsavedChanges(!isNaN(parsed) && parsed !== currentEpisode);
                  }}
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                  maxLength={4}
                  onBlur={handleInlineBlur}
                />
              ) : (
                <Text
                  style={[
                    styles.currentValue,
                    hasUnsavedChanges && styles.currentValueModified,
                  ]}
                >
                  {selectedEpisode}
                </Text>
              )}

              {totalEpisodes && (
                <Text style={styles.totalEpisodes}>/ {totalEpisodes}</Text>
              )}
            </View>

            {/* Edit/Done Button */}
            <Pressable style={styles.editButton} onPress={handleEditToggle}>
              <Text style={styles.editButtonText}>
                {isEditingInline ? '✓' : '✏️'}
              </Text>
            </Pressable>
          </View>

          {/* Progress Bar */}
          {totalEpisodes && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
          )}

          {/* Episode Picker - Always Visible */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionLabel}>Select Episode:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEpisode}
                onValueChange={(value) => {
                  setSelectedEpisode(Number(value));
                  setInlineEpisode(value.toString());
                  setHasUnsavedChanges(Number(value) !== currentEpisode);
                }}
                itemStyle={styles.pickerItem}
              >
                {availableEpisodes.map((episode) => (
                  <Picker.Item
                    key={episode}
                    label={formatEpisodeLabel(episode)}
                    value={episode}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttons}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.confirmButton,
                hasUnsavedChanges && styles.confirmButtonHighlighted,
              ]}
              onPress={handleConfirm}
              disabled={updateEpisode.isPending}
            >
              <Text style={styles.confirmButtonText}>
                {updateEpisode.isPending
                  ? 'Updating...'
                  : hasUnsavedChanges
                  ? 'Save Changes'
                  : 'Confirm'}
              </Text>
            </Pressable>
          </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#C7C7CC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  animeTitle: {
    fontSize: 15,
    color: '#86868B',
  },
  currentProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginBottom: 16,
  },
  currentLabel: {
    fontSize: 15,
    color: '#1D1D1F',
  },
  episodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginLeft: 8,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
  },
  currentValueModified: {
    color: '#F59E0B', // Orange/Amber (unsaved changes)
  },
  inlineEpisodeInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#7C3AED',
    minWidth: 50,
    textAlign: 'center',
  },
  inlineEpisodeInputModified: {
    color: '#F59E0B', // Orange/Amber
    borderColor: '#F59E0B', // Match border color
  },
  totalEpisodes: {
    fontSize: 20,
    fontWeight: '400',
    color: '#86868B',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  editButtonText: {
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
    minWidth: 50,
    textAlign: 'right',
  },
  pickerSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerItem: {
    height: 120,
    fontSize: 17,
  },
  jumpSection: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    color: '#1D1D1F',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  confirmButton: {
    backgroundColor: '#7C3AED',
  },
  confirmButtonHighlighted: {
    backgroundColor: '#F59E0B', // Orange to draw attention to unsaved changes
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  singleEpisodePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  markWatchedButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  markWatchedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  simpleCancelButton: {
    paddingVertical: 12,
  },
  simpleCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'center',
  },
});
