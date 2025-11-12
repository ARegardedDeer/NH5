import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  buttonSize,
  swipeColors,
  currentTheme,
  shadow,
} from '../../styles/discoverySwipeStyles';

interface ActionButtonsProps {
  onSkip: () => void;
  onRate: () => void;
  onAdd: () => void;
  disabled?: boolean;
}

export function ActionButtons({ onSkip, onRate, onAdd, disabled = false }: ActionButtonsProps) {
  const handlePress = (action: () => void) => {
    if (disabled) return;

    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    action();
  };

  return (
    <View style={styles.container}>
      {/* Skip Button (Left) */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.skipButton,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        onPress={() => handlePress(onSkip)}
        disabled={disabled}
        accessibilityLabel="Skip this anime"
      >
        {({ pressed }) => (
          <Text style={[styles.buttonIcon, pressed && styles.buttonIconPressed]}>
            👈
          </Text>
        )}
      </Pressable>

      {/* Rate Button (Center) */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.rateButton,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        onPress={() => handlePress(onRate)}
        disabled={disabled}
        accessibilityLabel="Rate this anime"
      >
        {({ pressed }) => (
          <Text style={[styles.buttonIcon, styles.rateIcon, pressed && styles.buttonIconPressed]}>
            ⭐
          </Text>
        )}
      </Pressable>

      {/* Add to Watchlist Button (Right) */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.addButton,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        onPress={() => handlePress(onAdd)}
        disabled={disabled}
        accessibilityLabel="Add to watchlist"
      >
        {({ pressed }) => (
          <Text style={[styles.buttonIcon, pressed && styles.buttonIconPressed]}>
            📖
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  button: {
    width: buttonSize.large,
    height: buttonSize.large,
    borderRadius: buttonSize.large / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: currentTheme.card,
    borderWidth: 2,
    marginHorizontal: 12,
    ...shadow.md,
  },
  skipButton: {
    borderColor: swipeColors.skip,
  },
  rateButton: {
    borderColor: swipeColors.rate,
  },
  addButton: {
    borderColor: swipeColors.add,
  },
  buttonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 30,
  },
  rateIcon: {
    fontSize: 34,
  },
  buttonIconPressed: {
    transform: [{ scale: 1.1 }],
  },
});
