import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = ['#5b13ec', '#C084FC', '#FF6EC7', '#4FC3F7', '#FFD93D', '#6BCB77', '#FF9A3C'];
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  endX: number;
  rotation: number;
}

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 400,
    duration: 1400 + Math.random() * 600,
    endX: (Math.random() - 0.5) * 160,
    rotation: Math.random() * 720 - 360,
  }));
}

interface ConfettiParticleProps {
  particle: Particle;
  onDone?: () => void;
}

function ConfettiParticle({ particle, onDone }: ConfettiParticleProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(particle.delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      particle.delay,
      withTiming(SCREEN_HEIGHT + 60, {
        duration: particle.duration,
        easing: Easing.in(Easing.quad),
      }),
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.endX, { duration: particle.duration, easing: Easing.out(Easing.cubic) }),
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation, { duration: particle.duration }),
    );

    // Fade out near the bottom — overrides the initial fade-in above
    opacity.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 100, easing: Easing.linear }, () => {
        opacity.value = withDelay(
          particle.duration * 0.6,
          withTiming(0, { duration: particle.duration * 0.4, easing: Easing.in(Easing.quad) }),
        );
      }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const isRect = particle.id % 3 !== 0;

  return (
    <Reanimated.View
      style={[
        style,
        {
          position: 'absolute',
          left: particle.x,
          top: 0,
          width: isRect ? particle.size * 0.6 : particle.size,
          height: isRect ? particle.size : particle.size * 0.6,
          borderRadius: isRect ? 2 : particle.size / 2,
          backgroundColor: particle.color,
        },
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

export function ConfettiOverlay({ visible, onComplete }: ConfettiOverlayProps) {
  const particles = React.useMemo(makeParticles, [visible]);

  useEffect(() => {
    if (!visible) return;
    const maxDuration = Math.max(...particles.map((p) => p.delay + p.duration));
    const timer = setTimeout(onComplete, maxDuration + 100);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} particle={p} />
      ))}
    </View>
  );
}
