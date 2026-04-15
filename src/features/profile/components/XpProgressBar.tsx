import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface XpProgressBarProps {
  xpCurrent: number;
  xpToNext: number;
}

const XP_PER_LEVEL = 500;

export default function XpProgressBar({ xpCurrent, xpToNext }: XpProgressBarProps) {
  const level = Math.floor(xpCurrent / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xpCurrent % XP_PER_LEVEL;
  const pct = xpIntoLevel / XP_PER_LEVEL;

  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withSpring(pct, { damping: 20, stiffness: 90 });
  }, [pct]);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>{xpToNext} XP to next level</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedFill]} />
      </View>
    </View>
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
