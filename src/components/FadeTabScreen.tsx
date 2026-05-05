import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

interface FadeTabScreenProps {
  children: React.ReactNode;
}

/**
 * Wraps a tab screen's content so it fades in when the tab gains focus
 * and fades out when it loses focus. Use as the root element inside each
 * tab screen component.
 */
export function FadeTabScreen({ children }: FadeTabScreenProps) {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(isFocused ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
  }, [isFocused]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
