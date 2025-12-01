import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export const TestReanimated = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
      >
        <Animated.View style={[styles.box, animatedStyle]}>
          <Text style={styles.text}>Press Me!</Text>
        </Animated.View>
      </Pressable>
      <Text style={styles.status}>✅ Reanimated installed and working!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0A1F',
  },
  box: {
    width: 150,
    height: 150,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 30,
    color: '#4ADE80',
    fontSize: 16,
  },
});

export default TestReanimated;
