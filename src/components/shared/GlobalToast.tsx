import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HapticFeedback from 'react-native-haptic-feedback';

interface GlobalToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
  onDismiss: () => void;
  onUndo?: () => void;
  undoLabel?: string;
}

export const GlobalToast: React.FC<GlobalToastProps> = ({
  visible,
  message,
  type,
  duration,
  onDismiss,
  onUndo,
  undoLabel = 'Undo',
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      console.log('[GlobalToast] 📢 Showing toast:', message);

      // Reset position first (immediate)
      translateY.value = 200;
      opacity.value = 0;

      // Then animate in (small delay to ensure reset completes)
      setTimeout(() => {
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        opacity.value = withSpring(1);
      }, 50);

      // Haptic feedback
      if (type === 'success') {
        HapticFeedback.trigger('notificationSuccess');
      } else if (type === 'error') {
        HapticFeedback.trigger('notificationError');
      } else {
        HapticFeedback.trigger('impactLight');
      }

      // Auto dismiss after duration
      const dismissTimeout = setTimeout(() => {
        translateY.value = withSpring(200, { damping: 15 }, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        });
        opacity.value = withSpring(0);
      }, duration);

      return () => clearTimeout(dismissTimeout);
    } else {
      // Reset when hidden
      translateY.value = 200;
      opacity.value = 0;
    }
  }, [visible, duration, type, message, translateY, opacity, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleUndo = () => {
    console.log('[GlobalToast] 🔄 Undo clicked');
    HapticFeedback.trigger('impactMedium');
    onUndo?.();
    onDismiss();
  };

  if (!visible) return null;

  const backgroundColor = {
    success: '#34C759',
    error: '#EF4444',
    info: '#7C3AED',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 20, // Above safe area
          backgroundColor,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.content}
        onPress={onUndo ? undefined : onDismiss} // Tap to dismiss if no undo
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>

        {onUndo && (
          <Pressable style={styles.undoButton} onPress={handleUndo}>
            <Text style={styles.undoText}>{undoLabel}</Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99999, // Above everything
    ...Platform.select({
      android: {
        elevation: 16, // Extra elevation for Android
      },
    }),
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

  icon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 12,
    fontWeight: '700',
  },

  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  undoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 12,
  },

  undoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
