import { Dimensions } from 'react-native';
import { currentTheme, borderRadius, shadow } from './discoverStyles';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// Card dimensions
export const CARD_WIDTH = SCREEN_WIDTH * 0.9;
export const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;
export const CARD_BORDER_RADIUS = borderRadius.xl;

// Swipe gesture thresholds
export const SWIPE_THRESHOLD = 120; // Distance to trigger swipe
export const SWIPE_VELOCITY_THRESHOLD = 0.3; // Speed to trigger swipe
export const ROTATION_FACTOR = 0.15; // Card tilt amount

// Action zones (for visual feedback)
export const ACTION_ZONES = {
  skip: { x: -SWIPE_THRESHOLD, label: 'Skip', color: '#EF4444', icon: '👈' },
  rate: { y: SWIPE_THRESHOLD, label: 'Rate', color: '#8B5CF6', icon: '⭐' },
  add: { x: SWIPE_THRESHOLD, label: 'Add to Watchlist', color: '#10B981', icon: '📖' },
};

// Colors
export const swipeColors = {
  skip: '#EF4444', // Red
  skipLight: '#FEE2E2',
  rate: '#8B5CF6', // Purple
  rateLight: '#EDE9FE',
  add: '#10B981', // Green
  addLight: '#D1FAE5',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Button sizes
export const buttonSize = {
  small: 56,
  large: 72,
};

// Export theme and shadows
export { currentTheme, borderRadius, shadow };
