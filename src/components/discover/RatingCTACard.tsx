import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
// import { useNavigation } from '@react-navigation/native';
import { currentTheme, spacing, borderRadius } from '../../styles/discoverStyles';

interface RatingCTACardProps {
  ratingsCount: number;
}

export function RatingCTACard({ ratingsCount }: RatingCTACardProps) {
  const remaining = 10 - ratingsCount;
  const progress = ratingsCount / 10;

  const handlePress = () => {
    console.log('[discover] Rate Anime CTA pressed');
    // TODO: Navigate to Home or show "Coming soon" toast
    // const navigation = useNavigation();
    // navigation.navigate('Home');
  };

  if (ratingsCount >= 10) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.header}>💡 Rate more for better picks</Text>

        {/* Body */}
        <Text style={styles.body}>
          You've rated <Text style={styles.bold}>{ratingsCount}</Text> anime
        </Text>
        <Text style={styles.body}>
          Rate <Text style={styles.bold}>{remaining}</Text> more to unlock
          personalized recommendations
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {ratingsCount}/10
          </Text>
        </View>

        {/* CTA Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handlePress}
        >
          <Text style={styles.buttonText}>Rate Anime →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
  progressContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'right',
  },
  button: {
    backgroundColor: currentTheme.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: currentTheme.primaryForeground,
  },
});
