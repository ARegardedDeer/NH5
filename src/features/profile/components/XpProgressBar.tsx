import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  useAnimatedStyle,
  FadeInDown,
} from 'react-native-reanimated';

interface XpProgressBarProps {
  xpCurrent: number;
  xpToNext: number;
  shouldAnimate?: boolean;
}

const XP_PER_LEVEL = 500;
const BAR_DELAY = 150;
const BAR_DURATION = 800;

function useCountUp(target: number, active: boolean, delay: number, duration: number) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    setDisplay(0);

    const startAt = Date.now() + delay;

    const tick = () => {
      const now = Date.now();
      if (now < startAt) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active, delay, duration]);

  return display;
}

export default function XpProgressBar({ xpCurrent, xpToNext, shouldAnimate = false }: XpProgressBarProps) {
  const level = Math.floor(xpCurrent / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xpCurrent % XP_PER_LEVEL;
  const pct = xpIntoLevel / XP_PER_LEVEL;

  const fillWidth = useSharedValue(0);
  const [animating, setAnimating] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || hasStartedRef.current) return;
    hasStartedRef.current = true;
    setAnimating(true);
    fillWidth.value = withDelay(
      BAR_DELAY,
      withTiming(pct * 100, {
        duration: BAR_DURATION,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [shouldAnimate]);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  const displayXp = useCountUp(xpIntoLevel, animating, BAR_DELAY, BAR_DURATION - 100);
  const displayToNext = useCountUp(xpToNext, animating, BAR_DELAY, BAR_DURATION - 100);

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(300)}
      style={styles.container}
    >
      <View style={styles.labels}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>
          {displayXp} / {XP_PER_LEVEL} XP · {displayToNext} to next
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedFill]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2a1f4a',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#5b13ec',
  },
});
