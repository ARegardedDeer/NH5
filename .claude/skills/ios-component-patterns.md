# iOS Component Patterns for NH5

## Overview
NH5-specific component architecture patterns, styling conventions, and solved problems. Use this skill when creating new components, fixing architecture bugs, or establishing code consistency.

---

## 1. Styling Convention: NativeWind vs StyleSheet

### Rule
- **Use NativeWind (Tailwind):** For reusable UI components in `src/ui/components/`
- **Use StyleSheet.create():** For screens, features, and screen-specific components

### Examples

#### ✅ Good: NativeWind in UI Components
```typescript
// src/ui/components/BadgeChip.tsx
export const BadgeChip = ({ label, variant }) => (
  <View className={cn(
    "px-3 py-1 rounded-full",
    variant === "primary" && "bg-purple-600",
    variant === "secondary" && "bg-gray-700"
  )}>
    <Text className="text-xs font-semibold text-white">{label}</Text>
  </View>
);
```

#### ✅ Good: StyleSheet in Screens
```typescript
// src/features/home/HomeScreen.tsx
const HomeScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Continue Watching</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161022',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
```

#### ❌ Bad: Mixed Approaches
```typescript
// Don't mix in the same file
<View className="flex-1" style={{ backgroundColor: '#161022' }}>
  <Text className="text-xl" style={styles.title}>Mixed</Text>
</View>
```

### Why This Rule?
- **Consistency:** Clear boundaries prevent style drift
- **Reusability:** UI components with Tailwind are more portable
- **Performance:** StyleSheet.create() optimizes screen-level styles
- **Tooling:** Tailwind autocomplete works better in isolated components

---

## 2. NH5 Theme Tokens

### Colors
```typescript
// NH5 Custom Theme (not Apple system colors)
export const NH5_THEME = {
  // Primary
  primary: '#5b13ec',        // Brand purple (not Apple systemPurple)
  primaryDark: '#4a0fc7',

  // Backgrounds
  background: '#161022',      // Main dark background
  backgroundSecondary: '#1e1230',
  backgroundTertiary: '#2a1a3e',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A4A2C1',
  textTertiary: '#6B6880',

  // Semantic
  success: '#34C759',         // iOS systemGreen
  error: '#FF3B30',           // iOS systemRed
  warning: '#FF9500',         // iOS systemOrange
  info: '#007AFF',            // iOS systemBlue
};
```

### Spacing
```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
```

### Border Radius
```typescript
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};
```

### Usage
```typescript
// Use tokens, not hardcoded values
<View style={{
  backgroundColor: NH5_THEME.background,     // ✅ Good
  // backgroundColor: '#161022',             // ❌ Bad
  paddingHorizontal: SPACING.xl,             // ✅ Good
  // paddingHorizontal: 24,                  // ❌ Bad
  borderRadius: RADIUS.md,                   // ✅ Good
  // borderRadius: 12,                       // ❌ Bad
}}>
```

---

## 3. Modal Layer Problem & Solution

### The Problem
React Native `<Modal>` creates a **new native window layer** above the React tree. Components rendered at app root (like global toasts) are invisible inside modals.
```typescript
// ❌ BAD - Toast won't show in modal
<App>
  <ToastProvider>
    <Navigation />
    <GlobalToast />  {/* Rendered on Layer 1 */}
  </ToastProvider>
</App>

<Modal>  {/* Layer 2 - separate window */}
  <DiscoverySwipe />
  {/* GlobalToast is invisible here - z-index won't fix this */}
</Modal>
```

### The Solution Pattern
**Context + Local Render:** Share state via context, render UI inside modal.
```typescript
// 1. Context exposes state (not just functions)
export const ToastProvider = ({ children }) => {
  const [toastState, setToastState] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  return (
    <ToastContext.Provider value={{
      showToast,
      hideToast,
      toastState  // ← Expose state
    }}>
      {children}
      <GlobalToast {...toastState} />  {/* For non-modal screens */}
    </ToastContext.Provider>
  );
};

// 2. Modal renders its own toast driven by shared state
const DiscoverySwipeModal = () => {
  const { showToast, hideToast, toastState } = useToast();

  return (
    <Modal visible={visible}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Modal content */}

        {/* Local toast, shared state - visible on this native layer */}
        <GlobalToast
          {...toastState}
          onDismiss={hideToast}
        />
      </GestureHandlerRootView>
    </Modal>
  );
};
```

### When to Use This Pattern
- ✅ Global toasts in modals
- ✅ Loading overlays in modals
- ✅ Bottom sheets inside modals
- ✅ Any overlay UI that needs to work across modal boundaries

### Anti-Pattern
❌ **Don't** try to fix with z-index — it won't work across native windows
❌ **Don't** duplicate state — use shared context

---

## 4. GestureHandlerRootView Placement

### Rule
Every screen using `react-native-gesture-handler` gestures must wrap in `GestureHandlerRootView`.

### Correct Placement
```typescript
// ✅ Good - At screen/modal root
const DiscoverySwipe = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <Swipeable {...}>
      <Card />
    </Swipeable>
  </GestureHandlerRootView>
);

// ✅ Good - In Modal (required — Modal is a new native window)
<Modal>
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SwipeableContent />
  </GestureHandlerRootView>
</Modal>
```

### Wrong Placement
```typescript
// ❌ Bad - Nested inside other views
const DiscoverySwipe = () => (
  <SafeAreaView>
    <View style={styles.container}>
      <GestureHandlerRootView>  {/* Too deep */}
        <Swipeable {...} />
      </GestureHandlerRootView>
    </View>
  </SafeAreaView>
);
```

### Why
`GestureHandlerRootView` must be the outermost component to properly capture touch events. Inside a Modal it must be re-declared since the modal is a new native window.

---

## 5. Swipeable Card Pattern (Discovery Swipe)

### Architecture
```typescript
const DiscoverySwipe = () => {
  const { showToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeLeft = useCallback(async (anime) => {
    await recordAction(anime.id, 'skip');
    showToast({ message: 'Skipped', type: 'info', duration: 2000 });
    setCurrentIndex(i => i + 1);
  }, [showToast]);

  const handleSwipeRight = useCallback(async (anime) => {
    await addToList(anime);
    showToast({ message: 'Added to Plan to Watch', type: 'success', duration: 2000 });
    setCurrentIndex(i => i + 1);
  }, [showToast]);

  return (
    <View>
      {cards.slice(currentIndex, currentIndex + 3).map((anime, i) => (
        <SwipeCard
          key={anime.id}
          anime={anime}
          index={i}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      ))}
    </View>
  );
};
```

### Key Points
- Render 3 cards at a time (current + 2 behind for visual depth)
- Use `currentIndex` to track progress through the queue
- Prefetch next 2 card images for smooth transitions
- Show toast confirmation after every swipe action
- Provide haptic feedback on swipe

---

## 6. My List Row Swipe Pattern

### Architecture
```typescript
import Swipeable from 'react-native-gesture-handler/Swipeable';

const MyListRow = ({ anime, onArchive, onDelete }) => {
  const renderLeftActions = () => (
    <View style={styles.leftAction}>
      <MaterialIcon name="archive" size={24} color="#FFF" />
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.rightAction}>
      <MaterialIcon name="delete" size={24} color="#FFF" />
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
      <View style={styles.row}>
        {/* Row content */}
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  leftAction: {
    backgroundColor: '#FF9500',  // Orange for archive (less destructive)
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  rightAction: {
    backgroundColor: '#FF3B30',  // Red for delete (more destructive)
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
```

### Key Points
- Left swipe (→) = less destructive action (archive, pause)
- Right swipe (←) = more destructive action (delete, remove)
- Use semantic colors: orange for reversible, red for destructive
- Provide haptic feedback on action trigger
- Show undo toast after destructive actions

---

## 7. Animation Standards (NH5)

### Spring Configuration
```typescript
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
};

// Usage with Reanimated
translateY.value = withSpring(0, SPRING_CONFIG);
```

### Haptic Feedback Types
```typescript
import HapticFeedback from 'react-native-haptic-feedback';

// Light tap (button press, selection)
HapticFeedback.trigger('impactLight');

// Medium impact (toggle, swipe action)
HapticFeedback.trigger('impactMedium');

// Heavy impact (important action)
HapticFeedback.trigger('impactHeavy');

// Success notification (toast success, add to list)
HapticFeedback.trigger('notificationSuccess');

// Error notification (toast error, failed action)
HapticFeedback.trigger('notificationError');
```

### Reanimated Patterns
```typescript
// ✅ Good - worklet for animations
const animatedStyle = useAnimatedStyle(() => {
  'worklet';
  return {
    transform: [{ translateX: translateX.value }],
  };
});

// ✅ Good - runOnJS for JS-side side effects from worklets
const handleSwipeComplete = () => {
  'worklet';
  runOnJS(showToast)({ message: 'Swiped!' });
};

// ❌ Bad - calling JS functions directly from worklet
const handleSwipeComplete = () => {
  'worklet';
  showToast({ message: 'Swiped!' });  // Will error - showToast is not a worklet
};
```

---

## 8. Context + Local Render Pattern (General)

### When to Use
- Need to share state across modal boundaries
- Want consistent API across app and modals
- Avoid duplicating logic while rendering in two places

### Implementation Template
```typescript
// 1. Create context with state exposed
interface FeatureContextType {
  state: FeatureState;
  updateState: (s: FeatureState) => void;
}

export const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider = ({ children }) => {
  const [state, setState] = useState<FeatureState>(initialState);

  const updateState = useCallback((newState: FeatureState) => {
    setState(newState);
  }, []);

  return (
    <FeatureContext.Provider value={{ state, updateState }}>
      {children}
      <FeatureUI state={state} />  {/* Root render - visible outside modals */}
    </FeatureContext.Provider>
  );
};

// 2. Use in modals — re-render UI on this native layer
const ModalScreen = () => {
  const { state, updateState } = useContext(FeatureContext);

  return (
    <Modal>
      <Content onAction={() => updateState(nextState)} />
      <FeatureUI state={state} />  {/* Local render - visible inside modal */}
    </Modal>
  );
};
```

---

## Quick Reference Checklist

When creating a new component:

- [ ] Choose styling: NativeWind (`src/ui/`) or StyleSheet (screens/features)?
- [ ] Use theme tokens, not hardcoded colors/spacing?
- [ ] Is it inside a Modal? Render overlays locally, not just at root?
- [ ] Using gestures? Wrap in `GestureHandlerRootView`?
- [ ] Using animations? Add haptic feedback?
- [ ] Springs: `damping: 15, stiffness: 150`
- [ ] Cross-thread calls from worklets? Use `runOnJS`
- [ ] Swipeable row? Left = less destructive, right = more destructive
- [ ] Touch targets >= 44pt? Add `hitSlop` if visual size is smaller

---

## Anti-Patterns to Avoid

❌ Mixing NativeWind and StyleSheet in the same component
❌ Hardcoding colors/spacing — use NH5_THEME, SPACING, RADIUS tokens
❌ Trying to fix Modal overlay visibility with z-index — use local render
❌ Forgetting GestureHandlerRootView inside a Modal
❌ Calling JS functions directly from Reanimated worklets — use runOnJS
❌ Using non-standard spring configs — stick to damping:15, stiffness:150
❌ Missing haptic feedback on user interactions
❌ Swipe actions without toast confirmation
