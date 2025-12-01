import { useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';

export const TIMINGS = {
  quick: 200,
  normal: 300,
  slow: 500,
};

export const SPRING_CONFIGS = {
  button: { damping: 15, stiffness: 150 },
  gentle: { damping: 20, stiffness: 100 },
  bouncy: { damping: 10, stiffness: 200 },
};

/**
 * Reusable button press animation hook
 * Returns animated style and press handlers
 */
export const useButtonPress = () => {
  const scale = useSharedValue(1);

  return {
    animatedStyle: {
      transform: [{ scale: scale.value }],
    },
    onPressIn: () => {
      scale.value = withSpring(0.95, SPRING_CONFIGS.button);
    },
    onPressOut: () => {
      scale.value = withSpring(1, SPRING_CONFIGS.button);
    },
  };
};

/**
 * Fade transition config for tab content
 */
export const fadeConfig = {
  duration: TIMINGS.quick,
  easing: Easing.inOut(Easing.ease),
};
