import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { useEpisodeUpdate } from '../hooks/useEpisodeUpdate';

interface EpisodeWidgetProps {
  animeId: string;
  currentEpisode: number;
  totalEpisodes: number | null;
  status: string | null;
  userId: string | null;
  onComplete: () => void;
  onEpisodeChange?: (newEpisode: number) => void;
}

export const EpisodeWidget: React.FC<EpisodeWidgetProps> = ({
  animeId,
  currentEpisode,
  totalEpisodes,
  status,
  userId,
  onComplete,
  onEpisodeChange,
}) => {
  const [showInputModal, setShowInputModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const episodeUpdate = useEpisodeUpdate();

  if (status !== 'Watching' && status !== 'Rewatching') return null;
  if (!totalEpisodes || totalEpisodes <= 0) return null;

  const displayEpisode = currentEpisode + 1;
  const progress = totalEpisodes > 0 ? Math.min(displayEpisode / totalEpisodes, 1) : 0;
  const progressPct = Math.round(progress * 100);
  const isAtLastEpisode = displayEpisode === totalEpisodes;

  const doUpdate = (newEp: number) => {
    if (!userId) return;
    HapticFeedback.trigger('impactLight');
    onEpisodeChange?.(newEp);
    episodeUpdate.mutate(
      { animeId, newEpisode: newEp, currentEpisode, totalEpisodes, userId, currentStatus: status ?? undefined },
      {
        onSuccess: (data) => {
          if (data.isComplete) onComplete();
        },
      }
    );
  };

  const handleDecrement = () => {
    if (currentEpisode <= 0) return;
    doUpdate(currentEpisode - 1);
  };

  const handleIncrement = () => {
    doUpdate(currentEpisode + 1);
  };

  const handleMarkComplete = () => {
    setShowMenu(false);
    doUpdate(totalEpisodes);
  };

  const openInputModal = () => {
    setInputValue(String(currentEpisode + 1));
    setShowInputModal(true);
    setShowMenu(false);
  };

  const handleSetEpisode = () => {
    const enteredEp = parseInt(inputValue, 10);
    if (isNaN(enteredEp) || enteredEp < 1 || enteredEp > totalEpisodes) return;
    setShowInputModal(false);
    doUpdate(enteredEp - 1);
  };

  const inputNum = parseInt(inputValue, 10);
  const inputInvalid = isNaN(inputNum) || inputNum < 1 || inputNum > totalEpisodes;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <Pressable onPress={openInputModal} hitSlop={8}>
          <Text style={styles.episodeLabel}>
            Episode{' '}
            <Text style={styles.epCurrent}>{displayEpisode}</Text>
            <Text style={styles.epSep}> / </Text>
            <Text style={styles.epTotal}>{totalEpisodes}</Text>
          </Text>
        </Pressable>
        <Pressable onPress={() => setShowMenu(true)} hitSlop={8} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>⋯</Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
        </View>
        <Text style={styles.progressPct}>{progressPct}%</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={handleDecrement}
          disabled={currentEpisode <= 0 || episodeUpdate.isPending}
          style={({ pressed }) => [
            styles.ctrlBtn,
            currentEpisode <= 0 && styles.ctrlBtnDisabled,
            pressed && styles.ctrlBtnPressed,
          ]}
        >
          <Text style={styles.ctrlBtnText}>−1</Text>
        </Pressable>
        <Pressable
          onPress={isAtLastEpisode ? handleMarkComplete : handleIncrement}
          disabled={episodeUpdate.isPending}
          style={({ pressed }) => [
            styles.ctrlBtn,
            isAtLastEpisode && styles.ctrlBtnComplete,
            pressed && styles.ctrlBtnPressed,
          ]}
        >
          <Text style={[styles.ctrlBtnText, isAtLastEpisode && styles.ctrlBtnCompleteText]}>
            {isAtLastEpisode ? '✓ Done' : '+1'}
          </Text>
        </Pressable>
      </View>

      {/* Episode input modal */}
      <Modal
        visible={showInputModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInputModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowInputModal(false)}>
          <Pressable style={styles.inputSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Jump to Episode</Text>
            <TextInput
              style={styles.epInput}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={handleSetEpisode}
            />
            <Text style={styles.sheetSub}>of {totalEpisodes} episodes</Text>
            {inputValue.length > 0 && inputInvalid && (
              <Text style={styles.inputError}>Enter a number between 1 and {totalEpisodes}</Text>
            )}
            <View style={styles.sheetBtns}>
              <Pressable
                onPress={() => setShowInputModal(false)}
                style={({ pressed }) => [styles.sheetBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.sheetBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSetEpisode}
                disabled={inputInvalid}
                style={({ pressed }) => [
                  styles.sheetBtn,
                  styles.sheetBtnPrimary,
                  inputInvalid && { opacity: 0.4 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.sheetBtnLabel, styles.sheetBtnLabelPrimary]}>Set</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Quick menu modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuSheet}>
            <Pressable
              onPress={openInputModal}
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: 'rgba(167,139,250,0.12)' }]}
            >
              <Text style={styles.menuItemText}>Jump to Episode…</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              onPress={handleMarkComplete}
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: 'rgba(167,139,250,0.12)' }]}
            >
              <Text style={styles.menuItemText}>Mark Series Complete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  episodeLabel: {
    fontSize: 15,
    color: '#fff',
  },
  epCurrent: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A78BFA',
    textDecorationLine: 'underline',
  },
  epSep: {
    color: 'rgba(255,255,255,0.4)',
  },
  epTotal: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  menuBtn: {
    paddingHorizontal: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    minWidth: 34,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  ctrlBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ctrlBtnDisabled: {
    opacity: 0.3,
  },
  ctrlBtnPressed: {
    opacity: 0.7,
  },
  ctrlBtnComplete: {
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderColor: 'rgba(52,199,89,0.4)',
  },
  ctrlBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  ctrlBtnCompleteText: {
    color: '#34C759',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  inputSheet: {
    backgroundColor: '#1a1625',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 44,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  epInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  sheetSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputError: {
    fontSize: 13,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 8,
  },
  sheetBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  sheetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sheetBtnPrimary: {
    backgroundColor: '#7C3AED',
  },
  sheetBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  sheetBtnLabelPrimary: {
    color: '#fff',
  },
  menuSheet: {
    backgroundColor: '#1e1830',
    marginHorizontal: 20,
    marginBottom: 44,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
