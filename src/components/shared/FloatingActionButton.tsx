import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

interface FloatingActionButtonProps {
  onPress: () => void;
  isExpanded?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  isExpanded = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Animate out when sheet expands
  React.useEffect(() => {
    if (isExpanded) {
      scale.value = withSpring(0.8);
      opacity.value = withTiming(0, { duration: 200 });
    } else {
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
    HapticFeedback.trigger('impactMedium');
  };

  const handlePressOut = () => {
    if (!isExpanded) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <AnimatedPressable
      style={[styles.fab, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={styles.icon}>+</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 32,
  },
});
