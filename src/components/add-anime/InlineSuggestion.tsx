import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { HighlightedText } from '../shared/HighlightedText';
import HapticFeedback from 'react-native-haptic-feedback';

interface InlineSuggestionProps {
  title: string;
  query: string;
  onPress: () => void; // Tap → show detail drawer
}

export const InlineSuggestion: React.FC<InlineSuggestionProps> = ({
  title,
  query,
  onPress,
}) => {
  const handlePress = () => {
    HapticFeedback.trigger('impactLight');
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.suggestion,
        pressed && styles.suggestionPressed,
      ]}
      onPress={handlePress}
    >
      <HighlightedText
        text={title}
        query={query}
        style={styles.suggestionText}
        highlightStyle={styles.highlightedText}
        numberOfLines={1}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },

  suggestionPressed: {
    backgroundColor: '#2A2A3E',
  },

  suggestionText: {
    fontSize: 15,
    color: '#FFFFFF',
  },

  highlightedText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
});
