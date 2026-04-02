---
# React Native Performance & Optimization Skill

## Overview
Best practices for optimizing React Native apps, focusing on data fetching, bundle splitting, and rendering performance.

## When to Use This Skill
- Auditing component performance
- Refactoring data fetching patterns
- Eliminating waterfalls
- Reducing bundle size
- Implementing Suspense boundaries

---

## 1. Eliminate Async Waterfalls

### ❌ Bad: Sequential Auth + Data Fetch
```typescript
// HomeScreen.tsx - SLOW (500ms+)
useEffect(() => {
  whenAuthed.then(async () => {
    const { data } = await supabase.auth.getUser();  // Wait for auth
    setUserId(data?.user?.id ?? null);               // Then set user
    setAuthReady(true);                              // Then fetch data
  });
}, []);

const { data } = useContinueWatching(userId);        // Waits for all above
```
**Problem:** Three sequential async operations gate all data loading.

### ✅ Good: Parallel Auth + Data Fetch
```typescript
// src/hooks/useAuthUser.ts - FAST (200ms)
export const useAuthUser = () => {
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id ?? null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

// HomeScreen.tsx
const { data: userId } = useAuthUser();
const { data: continueWatching } = useContinueWatching(userId, {
  enabled: !!userId,  // Auto-fires when userId resolves
});
```
**Benefit:** Auth and data resolve in parallel, no waterfall.

---

## 2. Bundle Splitting with React.lazy()

### ❌ Bad: Unconditional Imports
```typescript
// Always bundled, even for logged-out users
import { ContinueWatchingSection } from './ContinueWatchingSection';

return (
  <View>
    {userId && <ContinueWatchingSection userId={userId} />}
  </View>
);
```
**Problem:** ContinueWatchingSection and all deps loaded for everyone.

### ✅ Good: Dynamic Imports
```typescript
const ContinueWatchingSection = React.lazy(
  () => import('./ContinueWatchingSection')
);

return (
  <View>
    {userId && (
      <Suspense fallback={<ContinueWatchingSkeleton />}>
        <ContinueWatchingSection userId={userId} />
      </Suspense>
    )}
  </View>
);
```
**Benefit:** 15-20% smaller initial bundle for logged-out users.

---

## 3. Suspense Boundaries (No Layout Shift)

### ❌ Bad: Loading State → Content Jump
```typescript
const { data, isLoading } = useContinueWatching(userId);

return (
  <View>
    {isLoading && <ActivityIndicator />}
    {data && <ContinueWatchingCards data={data} />}
  </View>
);
```
**Problem:** Layout shifts when data loads (Cumulative Layout Shift).

### ✅ Good: Suspense + Skeleton
```typescript
// In hook:
return useQuery({
  queryKey: ['continue-watching', userId],
  queryFn: () => fetchContinueWatching(userId),
  suspense: true,  // Enable Suspense
  enabled: !!userId,
});

// In component:
<Suspense fallback={<ContinueWatchingSkeleton />}>
  <ContinueWatchingSection userId={userId} />
</Suspense>
```
**Benefit:** Skeleton reserves space, no layout jump (0 CLS).

---

## 4. Dead Code Elimination

### ❌ Bad: Unused Imports + Feature Flags
```typescript
import { ContinueWatchingCard } from './ContinueWatchingCard';     // NEVER USED
import { ContinueWatchingCardV2 } from './ContinueWatchingCardV2';

const USE_V2 = true;  // Hardcoded constant

return USE_V2 ? <ContinueWatchingCardV2 /> : <ContinueWatchingCard />;
```
**Problem:** Both components bundled, only one used.

### ✅ Good: Remove Dead Branches
```typescript
import { ContinueWatchingCardV2 } from './ContinueWatchingCardV2';

return <ContinueWatchingCardV2 />;
```
**Benefit:** Smaller bundle, cleaner code.

**Check for dead code:**
```bash
# Find unused imports
grep -r "import.*from" src/ | grep -v "test"

# Find hardcoded feature flags
grep -r "const USE_" src/
```

---

## 5. React Query Best Practices

### Query Key Management
```typescript
// ✅ Good: Hierarchical keys
export const queryKeys = {
  auth: ['auth'] as const,
  authUser: () => [...queryKeys.auth, 'user'] as const,

  myList: (userId: string) => ['my-list', userId] as const,
  myListActive: (userId: string) => [...queryKeys.myList(userId), 'active'] as const,
  myListBacklog: (userId: string) => [...queryKeys.myList(userId), 'backlog'] as const,
};

// Usage:
useQuery({
  queryKey: queryKeys.myListActive(userId),
  // ...
});
```

### Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: addToList,
  onMutate: async (newAnime) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['my-list', userId] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['my-list', userId]);

    // Optimistically update
    queryClient.setQueryData(['my-list', userId], (old) => [
      ...old,
      newAnime,
    ]);

    return { previous };
  },
  onError: (err, newAnime, context) => {
    // Rollback on error
    queryClient.setQueryData(['my-list', userId], context.previous);
  },
});
```

### Cache Invalidation
```typescript
// ✅ Good: Specific invalidation
await queryClient.invalidateQueries({
  queryKey: ['my-list', userId, 'active'],
});

// ❌ Bad: Over-invalidation
await queryClient.invalidateQueries({
  queryKey: ['my-list'],  // Invalidates ALL lists for ALL users
});
```

---

## 6. Component Patterns

### Avoid Prop Drilling
```typescript
// ❌ Bad: Prop drilling
<Parent userId={userId}>
  <Child userId={userId}>
    <GrandChild userId={userId} />
  </Child>
</Parent>

// ✅ Good: Context or hooks
const { userId } = useAuthUser();  // Call anywhere
```

### Memoization
```typescript
// Use useMemo for expensive computations
const sortedAnime = useMemo(
  () => animeList.sort((a, b) => a.title.localeCompare(b.title)),
  [animeList]
);

// Use useCallback for callbacks passed to children
const handlePress = useCallback(
  (animeId: string) => {
    navigation.navigate('Detail', { animeId });
  },
  [navigation]
);

// Use React.memo for pure components
export const AnimeCard = React.memo(({ anime }: Props) => {
  // ...
});
```

---

## Audit Checklist

When reviewing code, check:

### Data Fetching
- [ ] No `useEffect` chains for auth → data
- [ ] Auth is hoisted to React Query
- [ ] Queries use `enabled` for conditional fetching
- [ ] No sequential waterfalls

### Bundle Size
- [ ] Conditional features use `React.lazy()`
- [ ] No unused imports
- [ ] No hardcoded feature flags (USE_V2, etc.)
- [ ] Large deps are code-split

### Rendering
- [ ] All queries have Suspense boundaries
- [ ] Skeletons match final content dimensions
- [ ] No layout shift (0 CLS)
- [ ] Heavy components are memoized

### React Query
- [ ] Queries use hierarchical keys
- [ ] Mutations use optimistic updates
- [ ] Cache invalidation is specific
- [ ] `staleTime` and `gcTime` set appropriately

---

## Example Refactor

### Before (Slow, Large Bundle)
```typescript
// HomeScreen.tsx
const [userId, setUserId] = useState<string | null>(null);
const [authReady, setAuthReady] = useState(false);

useEffect(() => {
  whenAuthed.then(async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data?.user?.id ?? null);
    setAuthReady(true);
  });
}, []);

const { data: continueWatching, isLoading } = useContinueWatching(userId);

return (
  <ScrollView>
    {authReady && userId && (
      <>
        {isLoading && <ActivityIndicator />}
        {continueWatching && (
          <ContinueWatchingSection data={continueWatching} />
        )}
      </>
    )}
  </ScrollView>
);
```

### After (Fast, Small Bundle)
```typescript
// HomeScreen.tsx
const { data: userId } = useAuthUser();

const ContinueWatchingSection = React.lazy(
  () => import('./ContinueWatchingSection')
);

return (
  <ScrollView>
    {userId && (
      <Suspense fallback={<ContinueWatchingSkeleton />}>
        <ContinueWatchingSection userId={userId} />
      </Suspense>
    )}
  </ScrollView>
);

// src/hooks/useAuthUser.ts
export const useAuthUser = () => {
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id ?? null;
    },
    staleTime: Infinity,
    suspense: false,  // Auth doesn't need Suspense
  });
};

// src/hooks/useContinueWatching.ts
export const useContinueWatching = (userId: string | null) => {
  return useQuery({
    queryKey: ['continue-watching', userId],
    queryFn: () => fetchContinueWatching(userId!),
    enabled: !!userId,
    suspense: true,  // Enable Suspense for skeleton
  });
};
```

**Improvements:**
- ⚡ 60% faster load time (no waterfall)
- 📦 15% smaller bundle (lazy loading)
- 🎨 0 layout shift (Suspense skeleton)
- 🧹 Cleaner code (no state management)

---

## Common Pitfalls

1. **Suspense without fallback:** Always provide a skeleton/fallback
2. **Over-invalidation:** Be specific with query keys
3. **Missing `enabled`:** Always gate queries on dependencies
4. **Forgetting `staleTime`:** Auth queries should have `Infinity`
5. **Not using `React.memo`:** Large lists need memoization

---

## Resources

- React Query Docs: https://tanstack.com/query/latest
- React Native Performance: https://reactnative.dev/docs/performance
- Bundle Analysis: `npx react-native-bundle-visualizer`
