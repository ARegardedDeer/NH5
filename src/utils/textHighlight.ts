interface HighlightedPart {
  text: string;
  isMatch: boolean;
}

/**
 * Splits text into parts with matched characters highlighted
 * @param text - The full text to search in
 * @param query - The search query
 * @returns Array of text parts with match flags
 */
export const getHighlightedParts = (
  text: string,
  query: string
): HighlightedPart[] => {
  if (!query || query.length === 0) {
    return [{ text, isMatch: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    // No match found
    return [{ text, isMatch: false }];
  }

  const parts: HighlightedPart[] = [];

  // Before match
  if (index > 0) {
    parts.push({
      text: text.substring(0, index),
      isMatch: false,
    });
  }

  // The match
  parts.push({
    text: text.substring(index, index + query.length),
    isMatch: true,
  });

  // After match
  if (index + query.length < text.length) {
    parts.push({
      text: text.substring(index + query.length),
      isMatch: false,
    });
  }

  return parts;
};
