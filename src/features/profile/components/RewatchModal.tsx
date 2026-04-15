import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

interface RewatchModalProps {
  visible: boolean;
  initialCount: number;
  onSave: (count: number) => void;
  onCancel: () => void;
}

export default function RewatchModal({ visible, initialCount, onSave, onCancel }: RewatchModalProps) {
  const [count, setCount] = useState(initialCount);

  // Reset to initialCount each time modal opens
  React.useEffect(() => {
    if (visible) setCount(initialCount);
  }, [visible, initialCount]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Times Rewatched</Text>

          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepBtn, count === 0 && styles.stepBtnDisabled]}
              onPress={() => count > 0 && setCount(count - 1)}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>

            <Text style={styles.count}>{count}</Text>

            <Pressable
              style={[styles.stepBtn, count >= 99 && styles.stepBtnDisabled]}
              onPress={() => count < 99 && setCount(count + 1)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={() => onSave(count)}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1e1230',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5b13ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: '#2a1f4a',
    opacity: 0.5,
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  count: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 60,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5b13ec',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5b13ec',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#5b13ec',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
