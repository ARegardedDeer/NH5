# iOS UI/UX Best Practices for React Native

## Overview
Comprehensive guide for building iOS-native feeling interfaces in React Native, following Apple's Human Interface Guidelines and modern iOS design patterns.

---

## 1. Layout & Spacing

### Safe Area Management
```typescript
// ✅ Always respect safe areas
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
  {/* Content */}
</SafeAreaView>

// For specific edges only:
<SafeAreaView edges={['top']}>
  {/* Header */}
</SafeAreaView>
```

### 8pt Grid System
```typescript
// ✅ iOS Standard Spacing
const SPACING = {
  xs: 4,   // Tight spacing (icon padding)
  sm: 8,   // Compact spacing (between related items)
  md: 12,  // Default spacing (list row padding)
  lg: 16,  // Comfortable spacing (section padding)
  xl: 20,  // Generous spacing (screen margins)
  xxl: 24, // Large spacing (section separation)
  xxxl: 32, // Extra large (major sections)
};

// Usage:
paddingHorizontal: SPACING.xl,  // 20pt screen margins
gap: SPACING.md,                 // 12pt between items
```

### Minimum Touch Targets
```typescript
// ✅ iOS minimum: 44x44pt
const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // For smaller visual elements, add invisible padding
  iconButton: {
    width: 24,      // Visual size
    height: 24,
    padding: 10,    // Expands to 44x44pt touch area
  },
});
```

---

## 2. Typography (SF Pro)

### iOS Type Scale
```typescript
// ✅ iOS Standard Text Styles
const TYPOGRAPHY = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.06,
  },
};

// Usage:
<Text style={[TYPOGRAPHY.headline, { color: '#FFFFFF' }]}>
  Section Title
</Text>
```

### Font Weight
```typescript
// ✅ iOS Standard Weights
fontWeight: '400'  // Regular
fontWeight: '500'  // Medium (use sparingly)
fontWeight: '600'  // Semibold (preferred for emphasis)
fontWeight: '700'  // Bold (titles only)

// ❌ Avoid:
fontWeight: '300'  // Too light for body text
fontWeight: '800'  // Too heavy, not iOS-like
fontWeight: '900'  // Never use
```

---

## 3. Color System

### Semantic Colors (Light/Dark Mode)
```typescript
// ✅ iOS Semantic Color System
const COLORS = {
  // Labels
  label: {
    primary: '#000000',      // Light mode
    primaryDark: '#FFFFFF',  // Dark mode
  },
  labelSecondary: {
    primary: 'rgba(60, 60, 67, 0.6)',
    primaryDark: 'rgba(235, 235, 245, 0.6)',
  },
  labelTertiary: {
    primary: 'rgba(60, 60, 67, 0.3)',
    primaryDark: 'rgba(235, 235, 245, 0.3)',
  },

  // Fills (Backgrounds)
  fillPrimary: {
    primary: 'rgba(120, 120, 128, 0.2)',
    primaryDark: 'rgba(120, 120, 128, 0.36)',
  },
  fillSecondary: {
    primary: 'rgba(120, 120, 128, 0.16)',
    primaryDark: 'rgba(120, 120, 128, 0.32)',
  },

  // System Backgrounds
  systemBackground: {
    primary: '#FFFFFF',
    primaryDark: '#000000',
  },
  secondarySystemBackground: {
    primary: '#F2F2F7',
    primaryDark: '#1C1C1E',
  },
  tertiarySystemBackground: {
    primary: '#FFFFFF',
    primaryDark: '#2C2C2E',
  },

  // Grouped Backgrounds (for lists)
  systemGroupedBackground: {
    primary: '#F2F2F7',
    primaryDark: '#000000',
  },
  secondarySystemGroupedBackground: {
    primary: '#FFFFFF',
    primaryDark: '#1C1C1E',
  },

  // Separators
  separator: {
    primary: 'rgba(60, 60, 67, 0.29)',
    primaryDark: 'rgba(84, 84, 88, 0.6)',
  },

  // System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  systemTeal: '#5AC8FA',
  systemIndigo: '#5856D6',
  systemGray: '#8E8E93',
};

// Usage with dark mode:
const isDark = useColorScheme() === 'dark';
<View style={{
  backgroundColor: isDark
    ? COLORS.systemBackground.primaryDark
    : COLORS.systemBackground.primary
}} />
```

### Vibrancy & Translucency
```typescript
// ✅ iOS Blur Effects
import { BlurView } from '@react-native-community/blur';

<BlurView
  style={styles.absolute}
  blurType="light"      // light, dark, xlight
  blurAmount={10}
  reducedTransparencyFallbackColor="white"
/>

// Common use: Navigation bars, tab bars, modals
```

> **NH5 Note:** NH5 uses a custom dark theme (`#161022` bg, `#5b13ec` primary) rather than Apple system colors. See NH5_THEME tokens in `.claude/skills/ios-component-patterns.md` §2.

---

## 3.5 Styling Approach: NativeWind Integration

NH5 uses both NativeWind (Tailwind) and `StyleSheet.create()`. Follow this boundary:

| Location | Approach |
|---|---|
| `src/ui/components/` | NativeWind Tailwind classNames |
| Screens & feature components | `StyleSheet.create()` |

```typescript
// ✅ UI Component — NativeWind
// src/ui/components/BadgeChip.tsx
export const BadgeChip = ({ label }: { label: string }) => (
  <View className="px-3 py-1 bg-purple-600 rounded-full">
    <Text className="text-xs font-semibold text-white">{label}</Text>
  </View>
);

// ✅ Screen — StyleSheet
// src/screens/HomeScreen.tsx
const HomeScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Home</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#161022' },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
});

// ❌ Don't mix in the same component
<View className="flex-1" style={{ backgroundColor: '#161022' }}>
```

**See:** `.claude/skills/ios-component-patterns.md` §1 for full conventions.

---

## 4. Navigation Patterns

### Navigation Bar
```typescript
// ✅ iOS Standard Navigation
<Stack.Screen
  name="Detail"
  component={DetailScreen}
  options={{
    headerLargeTitle: true,           // Large title when scrolled to top
    headerTransparent: false,
    headerBlurEffect: 'systemMaterial',
    headerLargeTitleStyle: TYPOGRAPHY.largeTitle,
    headerTitleStyle: TYPOGRAPHY.headline,
  }}
/>

// In screen component:
navigation.setOptions({
  title: 'Episode Details',
  headerRight: () => (
    <Pressable onPress={handleShare}>
      <Text style={styles.navButton}>Share</Text>
    </Pressable>
  ),
});
```

### Tab Bar
```typescript
// ✅ iOS Standard Tab Bar
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#8E8E93',
    tabBarStyle: {
      height: 84,              // Includes safe area
      paddingTop: 8,
      paddingBottom: 24,       // Safe area bottom
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderTopWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tabBarLabelStyle: TYPOGRAPHY.caption2,
    tabBarIconStyle: {
      marginTop: 4,
    },
  }}
>
  <Tab.Screen
    name="Home"
    component={HomeScreen}
    options={{
      tabBarIcon: ({ color, size }) => (
        <MaterialIcon name="home" size={size} color={color} />
      ),
      tabBarBadge: 3,          // Badge number
    }}
  />
</Tab.Navigator>
```

### Modal Presentation
```typescript
// ✅ iOS Sheet Styles
<Stack.Screen
  name="AddAnime"
  component={AddAnimeSheet}
  options={{
    presentation: 'modal',              // Standard modal
    headerShown: false,
  }}
/>

// Or for bottom sheet:
<BottomSheet
  snapPoints={['50%', '90%']}
  enablePanDownToClose={true}
  handleComponent={() => (
    <View style={styles.handleContainer}>
      <View style={styles.handle} />
    </View>
  )}
/>

const styles = StyleSheet.create({
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#86868B',
  },
});
```

---

## 5. List Patterns

### Grouped List Style
```typescript
// ✅ iOS Settings-style grouped list
<ScrollView style={styles.container}>
  {/* Section 1 */}
  <Text style={styles.sectionHeader}>GENERAL</Text>
  <View style={styles.section}>
    <ListRow title="Profile" icon="person" onPress={() => {}} />
    <Divider />
    <ListRow title="Preferences" icon="settings" onPress={() => {}} />
    <Divider />
    <ListRow title="Notifications" icon="notifications" onPress={() => {}} />
  </View>
  <Text style={styles.sectionFooter}>
    Manage your account settings and preferences.
  </Text>

  {/* Section 2 */}
  <Text style={styles.sectionHeader}>SUPPORT</Text>
  <View style={styles.section}>
    <ListRow title="Help" icon="help" onPress={() => {}} />
  </View>
</ScrollView>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground.primaryDark,
  },

  sectionHeader: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.labelSecondary.primaryDark,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },

  section: {
    backgroundColor: COLORS.secondarySystemGroupedBackground.primaryDark,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },

  sectionFooter: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.labelSecondary.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
```

### List Row Component
```typescript
// ✅ iOS Standard List Row
const ListRow = ({ title, subtitle, icon, accessory = 'chevron', onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.row,
      pressed && styles.rowPressed,
    ]}
  >
    {icon && (
      <MaterialIcon
        name={icon}
        size={28}
        color={COLORS.systemBlue}
        style={styles.icon}
      />
    )}

    <View style={styles.content}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>

    {accessory === 'chevron' && (
      <MaterialIcon
        name="chevron-right"
        size={20}
        color={COLORS.labelTertiary.primaryDark}
      />
    )}
    {accessory === 'switch' && (
      <Switch value={true} onValueChange={() => {}} />
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },

  rowPressed: {
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
  },

  icon: {
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  title: {
    ...TYPOGRAPHY.body,
    color: COLORS.label.primaryDark,
  },

  subtitle: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.labelSecondary.primaryDark,
    marginTop: 2,
  },
});
```

### Swipeable Row (Mail App Style)
```typescript
// ✅ iOS Mail-style swipe actions
import Swipeable from 'react-native-gesture-handler/Swipeable';

const SwipeableRow = ({ onDelete, onArchive, children }) => {
  const renderLeftActions = () => (
    <View style={styles.leftAction}>
      <MaterialIcon name="archive" size={24} color="#FFF" />
      <Text style={styles.actionText}>Archive</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.rightAction}>
      <MaterialIcon name="delete" size={24} color="#FFF" />
      <Text style={styles.actionText}>Delete</Text>
    </View>
  );

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') onArchive();
        if (direction === 'right') onDelete();
      }}
      friction={2}
      overshootFriction={8}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  leftAction: {
    backgroundColor: COLORS.systemOrange,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    flex: 1,
  },

  rightAction: {
    backgroundColor: COLORS.systemRed,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    flex: 1,
  },

  actionText: {
    ...TYPOGRAPHY.footnote,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 4,
  },
});
```

---

## 6. Buttons & Controls

### Button Styles
```typescript
// ✅ iOS Button Hierarchy
const Button = ({ title, variant = 'filled', onPress }) => {
  const styles = getButtonStyles(variant);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

const getButtonStyles = (variant) => {
  const base = {
    button: {
      height: 50,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    text: {
      ...TYPOGRAPHY.headline,
      fontWeight: '600',
    },
  };

  if (variant === 'filled') {
    return {
      ...base,
      button: {
        ...base.button,
        backgroundColor: COLORS.systemBlue,
      },
      text: {
        ...base.text,
        color: '#FFFFFF',
      },
      pressed: {
        opacity: 0.8,
      },
    };
  }

  if (variant === 'tinted') {
    return {
      ...base,
      button: {
        ...base.button,
        backgroundColor: 'rgba(0, 122, 255, 0.15)',
      },
      text: {
        ...base.text,
        color: COLORS.systemBlue,
      },
      pressed: {
        backgroundColor: 'rgba(0, 122, 255, 0.25)',
      },
    };
  }

  if (variant === 'plain') {
    return {
      ...base,
      button: {
        ...base.button,
        backgroundColor: 'transparent',
      },
      text: {
        ...base.text,
        color: COLORS.systemBlue,
      },
      pressed: {
        opacity: 0.5,
      },
    };
  }
};
```

### Text Input (Floating Label)
```typescript
// ✅ iOS Standard Input
const FloatingLabelInput = ({ label, value, onChangeText }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.label,
          (isFocused || hasValue) && styles.labelFloating,
        ]}
      >
        {label}
      </Animated.Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.fillSecondary.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },

  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.labelSecondary.primaryDark,
    position: 'absolute',
    top: 16,
    left: 16,
  },

  labelFloating: {
    ...TYPOGRAPHY.caption1,
    top: 8,
  },

  input: {
    ...TYPOGRAPHY.body,
    color: COLORS.label.primaryDark,
    paddingTop: 4,
  },
});
```

---

## 7. Animation Standards

### Spring Animations
```typescript
// ✅ iOS Standard Spring Parameters
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Usage with Reanimated:
translateY.value = withSpring(0, SPRING_CONFIG);

// Usage with Animated:
Animated.spring(animatedValue, {
  toValue: 1,
  ...SPRING_CONFIG,
  useNativeDriver: true,
}).start();
```

### Timing Curves
```typescript
// ✅ iOS Standard Easing
const EASING = {
  // UI element animations
  standard: Easing.bezier(0.4, 0, 0.2, 1),

  // Enter animations
  decelerate: Easing.bezier(0, 0, 0.2, 1),

  // Exit animations
  accelerate: Easing.bezier(0.4, 0, 1, 1),

  // Emphasized animations
  emphasized: Easing.bezier(0.4, 0, 0.6, 1),
};

// Usage:
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  easing: EASING.standard,
  useNativeDriver: true,
}).start();
```

### Haptic Feedback
```typescript
// ✅ iOS Haptic Patterns
import HapticFeedback from 'react-native-haptic-feedback';

// Light tap (button press)
HapticFeedback.trigger('impactLight');

// Medium impact (toggle, slider)
HapticFeedback.trigger('impactMedium');

// Heavy impact (important action)
HapticFeedback.trigger('impactHeavy');

// Selection change (picker, segmented control)
HapticFeedback.trigger('selection');

// Notifications
HapticFeedback.trigger('notificationSuccess');
HapticFeedback.trigger('notificationWarning');
HapticFeedback.trigger('notificationError');

// Rigid impact (error, hard stop)
HapticFeedback.trigger('rigid');

// Soft impact (gentle feedback)
HapticFeedback.trigger('soft');
```

---

## 8. Cards & Containers

### Card Component
```typescript
// ✅ iOS Standard Card
const Card = ({ children, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      pressed && styles.cardPressed,
    ]}
  >
    {children}
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.secondarySystemGroupedBackground.primaryDark,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,  // Android
  },

  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
```

### Section Container
```typescript
// ✅ iOS Section Style
const Section = ({ title, children, footer }) => (
  <View style={styles.section}>
    {title && (
      <Text style={styles.sectionTitle}>{title}</Text>
    )}

    <View style={styles.sectionContent}>
      {children}
    </View>

    {footer && (
      <Text style={styles.sectionFooter}>{footer}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label.primaryDark,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  sectionContent: {
    // Content goes here
  },

  sectionFooter: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.labelSecondary.primaryDark,
    paddingHorizontal: 20,
    marginTop: 8,
  },
});
```

---

## 9. Loading States

### Skeleton Loaders
```typescript
// ✅ iOS-style skeleton (subtle shimmer)
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const CardSkeleton = () => (
  <View style={styles.card}>
    <ShimmerPlaceholder style={styles.poster} />
    <ShimmerPlaceholder style={styles.title} />
    <ShimmerPlaceholder style={styles.subtitle} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },

  poster: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.fillSecondary.primaryDark,
  },

  title: {
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: COLORS.fillSecondary.primaryDark,
  },

  subtitle: {
    height: 16,
    width: '60%',
    borderRadius: 4,
    backgroundColor: COLORS.fillSecondary.primaryDark,
  },
});
```

### Activity Indicator
```typescript
// ✅ iOS Standard Spinner
<ActivityIndicator
  size="large"  // 'small' or 'large'
  color={COLORS.systemGray}
  style={styles.spinner}
/>

const styles = StyleSheet.create({
  spinner: {
    paddingVertical: 40,
  },
});
```

---

## 10. Empty States

### iOS Empty State Pattern
```typescript
// ✅ Centered empty state with illustration
const EmptyState = ({ icon, title, message, action }) => (
  <View style={styles.container}>
    <View style={styles.iconContainer}>
      <MaterialIcon
        name={icon}
        size={64}
        color={COLORS.labelTertiary.primaryDark}
      />
    </View>

    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>

    {action && (
      <Pressable
        onPress={action.onPress}
        style={styles.actionButton}
      >
        <Text style={styles.actionText}>{action.label}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.fillSecondary.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label.primaryDark,
    textAlign: 'center',
    marginBottom: 8,
  },

  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.labelSecondary.primaryDark,
    textAlign: 'center',
    marginBottom: 24,
  },

  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  actionText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.systemBlue,
    fontWeight: '600',
  },
});
```

---

## 11. Toast Notifications (iOS Style)

### iOS-style Toast
```typescript
// ✅ Subtle, non-intrusive notification
const Toast = ({ visible, message, type, onDismiss }) => {
  const translateY = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_CONFIG);

      // Auto-dismiss
      setTimeout(() => {
        translateY.value = withSpring(100, SPRING_CONFIG);
        setTimeout(onDismiss, 300);
      }, 3000);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.toast, animatedStyle]}>
      <BlurView blurType="dark" style={styles.blur}>
        <MaterialIcon
          name={type === 'success' ? 'check-circle' : 'error'}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.message}>{message}</Text>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },

  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  message: {
    ...TYPOGRAPHY.callout,
    color: '#FFFFFF',
    flex: 1,
  },
});
```

> **NH5 Note:** The actual implementation uses solid-color backgrounds (not BlurView) with `zIndex: 99999`. See `.claude/skills/ios-component-patterns.md` for the exact implementation.
>
> **Modal caveat:** When displaying toasts inside a `<Modal>` screen, you must render `GlobalToast` locally inside the modal — root-level toasts are invisible across the native window boundary. See "React Native Modal Layer" section below.

---

## 12. React Native Modal Layer

### The Modal Window Problem

React Native's `<Modal>` component creates a **separate native window** above the main app window. Any component rendered at the app root (toasts, loading overlays, error banners) is **invisible** inside a modal — `zIndex` cannot bridge native window boundaries.

```typescript
// ❌ This won't work — zIndex is irrelevant across native windows
<App>
  <GlobalToast style={{ zIndex: 99999 }} />  {/* Layer 1 */}
</App>

<Modal>  {/* Layer 2 — separate native window */}
  <Content />
  {/* GlobalToast is physically invisible here */}
</Modal>
```

### The Solution: Context + Local Render

Share state via React Context, render UI inside the modal's own layer:

```typescript
// 1. Expose toast state from context (not just actions)
export const ToastProvider = ({ children }) => {
  const [toastState, setToastState] = useState({ visible: false, message: '' });

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toastState }}>
      {children}
      <GlobalToast {...toastState} />  {/* For non-modal screens */}
    </ToastContext.Provider>
  );
};

// 2. Modal renders its own instance, driven by shared state
const MyModal = () => {
  const { showToast, hideToast, toastState } = useToast();

  return (
    <Modal visible={visible}>
      <Content onAction={() => showToast({ message: 'Done!' })} />
      <GlobalToast {...toastState} onDismiss={hideToast} />  {/* Visible here */}
    </Modal>
  );
};
```

### Applies To
- Global toasts in modals ← most common
- Loading overlays inside modals
- Any overlay UI crossing the modal boundary

**See:** `.claude/skills/ios-component-patterns.md` §3 for full pattern.

---

## 13. Search Bar

### iOS Standard Search
```typescript
// ✅ iOS Search Bar
const SearchBar = ({ value, onChangeText, placeholder, onCancel }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchBar,
        isFocused && styles.searchBarFocused,
      ]}>
        <MaterialIcon
          name="search"
          size={20}
          color={COLORS.labelSecondary.primaryDark}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.labelSecondary.primaryDark}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
          returnKeyType="search"
        />

        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')}>
            <MaterialIcon
              name="close"
              size={20}
              color={COLORS.labelSecondary.primaryDark}
            />
          </Pressable>
        )}
      </View>

      {isFocused && (
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fillSecondary.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    gap: 8,
  },

  searchBarFocused: {
    backgroundColor: COLORS.fillPrimary.primaryDark,
  },

  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.label.primaryDark,
    paddingVertical: 0,
  },

  cancelButton: {
    marginLeft: 12,
  },

  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.systemBlue,
  },
});
```

---

## 14. Accessibility

### VoiceOver Support
```typescript
// ✅ Proper accessibility labels
<Pressable
  accessible={true}
  accessibilityLabel="Add to list"
  accessibilityHint="Adds this anime to your watchlist"
  accessibilityRole="button"
  onPress={handleAdd}
>
  <MaterialIcon name="add" size={24} />
</Pressable>

// For images:
<Image
  source={poster}
  accessible={true}
  accessibilityLabel="Attack on Titan poster"
  accessibilityRole="image"
/>

// For text that's not a label:
<Text
  accessible={true}
  accessibilityRole="header"
  accessibilityLevel={1}
>
  Section Title
</Text>
```

### Dynamic Type
```typescript
// ✅ Support text scaling
import { useWindowDimensions } from 'react-native';

const { fontScale } = useWindowDimensions();

<Text style={[
  TYPOGRAPHY.body,
  { fontSize: 17 * fontScale }  // Scales with system settings
]}>
  Body text
</Text>
```

---

## Common Mistakes to Avoid

### ❌ Don't:
1. Use Android Material Design patterns
2. Ignore safe areas (notch, home indicator)
3. Use non-iOS colors (Material blue, etc.)
4. Implement custom navigation that doesn't follow iOS patterns
5. Use heavy shadows (keep them subtle)
6. Ignore dark mode
7. Use non-standard fonts without good reason
8. Create touch targets smaller than 44x44pt
9. Use heavy animations (spring is standard)
10. Ignore haptic feedback

### ✅ Do:
1. Follow Apple's Human Interface Guidelines
2. Use system colors for consistency
3. Implement proper dark mode support
4. Add haptic feedback to interactions
5. Use spring animations (damping: 15, stiffness: 150)
6. Respect safe areas everywhere
7. Use SF Pro font family (or system default)
8. Support Dynamic Type
9. Add VoiceOver labels
10. Test on real devices

---

## Resources

- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- iOS Design Patterns: https://www.iosdesignkit.io/
- React Native docs: https://reactnative.dev/
- SF Symbols: https://developer.apple.com/sf-symbols/

---

## Quick Checklist

Use this for every screen:

- [ ] Safe areas respected
- [ ] Dark mode supported
- [ ] Proper text styles (SF Pro scale)
- [ ] Semantic colors used
- [ ] Touch targets ≥ 44x44pt
- [ ] Spring animations (damping 15, stiffness 150)
- [ ] Haptic feedback on interactions
- [ ] VoiceOver labels present
- [ ] Dynamic Type supported
- [ ] Follows iOS navigation patterns
- [ ] Proper loading states (skeleton)
- [ ] Empty states implemented
- [ ] No layout shift
- [ ] Proper spacing (8pt grid)
- [ ] iOS-style modals/sheets
