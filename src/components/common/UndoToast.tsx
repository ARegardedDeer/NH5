import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UndoToastProps {
  message: string;
  visible: boolean;
  onUndo: () => void;
  onHide?: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, visible, onUndo, onHide }) => {
  const insets = useSafeAreaInsets();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onHide?.();
      }, 4000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.toast}>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Pressable
          style={styles.undoButton}
          onPress={() => {
            onUndo();
            onHide?.();
          }}
        >
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  message: {
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  undoText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default UndoToast;
