import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
// @ts-ignore - Icon library type definitions
import Ionicons from 'react-native-vector-icons/Ionicons';
import { currentTheme, spacing, borderRadius } from '../../styles/discoverStyles';

interface SearchBarProps {
  onFocus?: () => void;
  placeholder?: string;
}

export function SearchBar({
  onFocus,
  placeholder = 'Search anime, genres, studios...',
}: SearchBarProps) {
  const handleFocus = () => {
    console.log('[discover] SearchBar focused');
    onFocus?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <Ionicons
          name="search"
          size={20}
          color={currentTheme.mutedForeground}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.mutedForeground}
          onFocus={handleFocus}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: currentTheme.background,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: currentTheme.input,
    borderWidth: 1,
    borderColor: currentTheme.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: currentTheme.foreground,
    paddingVertical: 0, // Remove default padding
    ...Platform.select({
      android: {
        paddingTop: 0,
        paddingBottom: 0,
      },
    }),
  },
});
