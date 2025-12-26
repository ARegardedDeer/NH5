import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss: () => void;
  onUndo?: () => void; // NEW: Optional undo callback
  undoLabel?: string; // NEW: Undo button label
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onDismiss,
  onUndo,
  undoLabel = 'Undo',
}) => {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      console.log('[Toast] 🎉 Showing toast:', message);
      // Slide up
      translateY.value = withSpring(-20, { damping: 15 });
      opacity.value = withSpring(1);

      // Haptic feedback
      if (type === 'success') {
        HapticFeedback.trigger('notificationSuccess');
      } else if (type === 'error') {
        HapticFeedback.trigger('notificationError');
      }

      // Auto dismiss
      translateY.value = withDelay(
        duration,
        withSpring(100, { damping: 15 }, () => {
          runOnJS(onDismiss)();
        })
      );
      opacity.value = withDelay(duration, withSpring(0));
    }
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleUndo = () => {
    HapticFeedback.trigger('impactMedium');
    onUndo?.();
    onDismiss();
  };

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#EF4444';
      case 'info':
      default:
        return '#7C3AED';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: getBackgroundColor() },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message}>{message}</Text>

        {/* Undo Button */}
        {onUndo && (
          <Pressable
            style={styles.undoButton}
            onPress={handleUndo}
          >
            <Text style={styles.undoText}>{undoLabel}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
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

  // Undo button styles
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
