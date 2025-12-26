import React from 'react';
import { Text, TextStyle } from 'react-native';
import { getHighlightedParts } from '../../utils/textHighlight';

interface HighlightedTextProps {
  text: string;
  query: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
  numberOfLines?: number;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  query,
  style,
  highlightStyle,
  numberOfLines,
}) => {
  const parts = getHighlightedParts(text, query);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => (
        <Text
          key={index}
          style={part.isMatch ? highlightStyle : undefined}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};
