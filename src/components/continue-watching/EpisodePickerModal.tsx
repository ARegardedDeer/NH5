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
import { useEpisodeUpdate } from '../../hooks/useEpisodeUpdate';

interface EpisodePickerModalProps {
  visible: boolean;
  onClose: () => void;
  userListId: string;
  animeId: string;
  animeTitle: string;
  currentEpisode: number;
  totalEpisodes: number | null;
  hasSpecials: boolean;
  userId: string;
  onComplete?: (animeId: string) => void;
}

export const EpisodePickerModal: React.FC<EpisodePickerModalProps> = ({
  visible,
  onClose,
  userListId,
  animeId,
  animeTitle,
  currentEpisode,
  totalEpisodes,
  hasSpecials,
  userId,
  onComplete,
}) => {
  const updateEpisode = useEpisodeUpdate();
  const [selectedEpisode, setSelectedEpisode] = useState<number>(currentEpisode);
  const [jumpToEpisode, setJumpToEpisode] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedEpisode(currentEpisode);
      setJumpToEpisode('');
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

  const performUpdate = (episodeToSet: number) => {
    updateEpisode.mutate(
      {
        userListId,
        animeId,
        newEpisode: episodeToSet,
        currentEpisode,
        totalEpisodes,
        userId,
      },
      {
        onSuccess: (data) => {
          if (data.isComplete) {
            onComplete?.(animeId);
          }
          onClose();
        },
      },
    );
  };

  const handleConfirm = () => {
    const parsedEpisode = jumpToEpisode ? parseFloat(jumpToEpisode) : selectedEpisode;

    if (Number.isNaN(parsedEpisode) || parsedEpisode < 1) {
      Alert.alert('Invalid Episode', 'Please enter a valid episode number.');
      return;
    }

    if (totalEpisodes && parsedEpisode > totalEpisodes) {
      Alert.alert(
        'Episode Out of Range',
        `This anime has ${totalEpisodes} episodes. Please enter a number between 1 and ${totalEpisodes}.`,
      );
      return;
    }

    if (isBigJump(parsedEpisode)) {
      Alert.alert(
        'Jump Ahead?',
        `You're jumping from Episode ${currentEpisode} to Episode ${parsedEpisode}.\n\nThis will mark episodes 1-${parsedEpisode} as watched.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => performUpdate(parsedEpisode) },
        ],
      );
      return;
    }

    performUpdate(parsedEpisode);
  };

  const isLongSeries = totalEpisodes ? totalEpisodes >= 100 : false;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Progress</Text>
            <Text style={styles.animeTitle} numberOfLines={1}>
              {animeTitle}
            </Text>
          </View>

          <View style={styles.currentProgress}>
            <Text style={styles.currentLabel}>Current Episode:</Text>
            <Text style={styles.currentValue}>
              {currentEpisode}
              {totalEpisodes ? ` / ${totalEpisodes}` : ''}
            </Text>
          </View>

          <View style={styles.pickerSection}>
            <Text style={styles.sectionLabel}>Select Episode:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEpisode}
                onValueChange={(value) => setSelectedEpisode(Number(value))}
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

          {isLongSeries && (
            <View style={styles.jumpSection}>
              <Text style={styles.sectionLabel}>Or jump to episode:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Episode number"
                keyboardType="decimal-pad"
                value={jumpToEpisode}
                onChangeText={setJumpToEpisode}
                placeholderTextColor="#86868B"
              />
            </View>
          )}

          <View style={styles.buttons}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={updateEpisode.isPending}
            >
              <Text style={styles.confirmButtonText}>
                {updateEpisode.isPending ? 'Updating...' : 'Confirm'}
              </Text>
            </Pressable>
          </View>
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
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginBottom: 20,
  },
  currentLabel: {
    fontSize: 15,
    color: '#1D1D1F',
  },
  currentValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#7C3AED',
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
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
