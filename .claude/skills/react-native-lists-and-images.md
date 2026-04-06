# React Native Lists & Image Performance

## Overview
Optimization patterns for FlatList rendering and image loading in NH5. Use when building/optimizing list screens (My List, Continue Watching, Search Results).

---

## FlatList Optimization

### Essential Props
```typescript
import { FlatList } from 'react-native';

<FlatList
  data={animeList}
  renderItem={renderAnimeCard}

  // Performance props
  keyExtractor={(item) => item.id.toString()}  // Stable unique key
  getItemLayout={getItemLayout}                 // Skip measurement
  removeClippedSubviews={true}                  // Unmount offscreen
  maxToRenderPerBatch={10}                      // Render batch size
  windowSize={5}                                // Render window multiplier
  initialNumToRender={10}                       // First render count
  updateCellsBatchingPeriod={50}                // Batch update delay

  // Pagination
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

### keyExtractor — Critical!
```typescript
// ✅ Good - Stable string key
keyExtractor={(item) => item.id.toString()}
keyExtractor={(item) => `anime-${item.id}`}

// ❌ Bad - Index as key (causes re-renders on reorder/insert)
keyExtractor={(item, index) => index.toString()}

// ❌ Bad - Random key (breaks React reconciliation entirely)
keyExtractor={(item) => Math.random().toString()}
```

### getItemLayout — Skip Measurement

When all items have the **same height**, provide layout to skip measurement:
```typescript
const ITEM_HEIGHT = 140;  // Card height including margin

const getItemLayout = (data: any, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

<FlatList
  data={items}
  getItemLayout={getItemLayout}  // Instant scroll-to-index, no jank
  renderItem={renderCard}
/>
```

**When NOT to use:**
- Variable height items (search results with different text lengths)
- Items with dynamic content (expanded/collapsed states)
- Horizontal lists with varying widths

### windowSize — Render Window

Controls how many screen heights to keep rendered off-screen:
```typescript
// Default: 21 (10 above + current + 10 below) — usually too high
<FlatList windowSize={21} />

// Smaller = less memory, slightly more blank frames during fast scroll
<FlatList windowSize={5} />   // 2 above + current + 2 below

// Rule of thumb:
// - Long stable lists (<500 items): windowSize={5}
// - Infinite scroll feeds: windowSize={10}
// - Short lists (<50 items): leave default, doesn't matter
```

### removeClippedSubviews
```typescript
// ✅ Enable for long lists
<FlatList
  data={myList}              // 100+ items
  removeClippedSubviews={true}
/>

// Avoid for short lists — unmounting overhead isn't worth it
<FlatList
  data={continueWatching}   // 5-10 items
  removeClippedSubviews={false}
/>
```

### Memoize renderItem
```typescript
import React, { memo, useCallback } from 'react';

// ✅ Good - Memoized card component
const AnimeCard = memo(({ anime, onPress }: { anime: Anime; onPress: (id: string) => void }) => (
  <Pressable onPress={() => onPress(anime.id)}>
    <Image source={{ uri: anime.posterUrl }} style={styles.poster} />
    <Text style={styles.title}>{anime.title}</Text>
  </Pressable>
));

// ✅ Good - Stable renderItem callback
const MyList = () => {
  const handlePress = useCallback((id: string) => {
    navigation.navigate('AnimeDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Anime }) => (
    <AnimeCard anime={item} onPress={handlePress} />
  ), [handlePress]);

  return <FlatList data={list} renderItem={renderItem} />;
};

// ❌ Bad - Inline function recreated every render, breaks memo
<FlatList
  data={list}
  renderItem={({ item }) => (
    <AnimeCard anime={item} onPress={(id) => navigate(id)} />
  )}
/>
```

---

## Image Performance

### Image.prefetch() Pattern

Preload images before they're needed (already used in Discovery Swipe):
```typescript
import { Image } from 'react-native';

const DiscoverySwipe = () => {
  const preloadedImages = useRef(new Set<string>());

  useEffect(() => {
    if (!queue || queue.length === 0) return;

    // Prefetch current + next 2 cards
    const cardsToPreload = [
      queue[currentIndex],
      queue[currentIndex + 1],
      queue[currentIndex + 2],
    ].filter(Boolean);

    cardsToPreload.forEach((card) => {
      if (!card?.posterUrl) return;
      if (preloadedImages.current.has(card.posterUrl)) return;  // Deduplicate

      Image.prefetch(card.posterUrl)
        .then(() => preloadedImages.current.add(card.posterUrl))
        .catch(() => {});  // Silent fail — prefetch is best-effort
    });
  }, [currentIndex, queue?.length]);
};
```

**When to prefetch:**
- ✅ Swipe cards (next 3-5 items)
- ✅ Pagination (next page thumbnail batch)
- ✅ Tab switching (preload hidden tab images)
- ❌ Entire list upfront (memory bloat)

### Resize Modes
```typescript
// Poster images — fill the box, crop excess
<Image
  source={{ uri: posterUrl }}
  style={{ width: 140, height: 200 }}
  resizeMode="cover"
/>

// Full-screen backgrounds
<Image
  source={{ uri: bgUrl }}
  style={StyleSheet.absoluteFill}
  resizeMode="cover"
/>

// Logos / icons — preserve aspect ratio
<Image
  source={{ uri: logoUrl }}
  style={{ width: 200, height: 80 }}
  resizeMode="contain"
/>
```

| Mode | Behavior | Use for |
|---|---|---|
| `cover` | Fill container, crop overflow | Posters, backgrounds |
| `contain` | Fit inside container | Logos, icons |
| `stretch` | Distort to fill | Almost never |
| `center` | No scaling, centered | Pixel-exact assets |

### FastImage vs RN Image

**Stick with RN Image when:**
- Simple use case (default caching is fine)
- Avoiding extra native dependency
- No GIF support needed

**Use FastImage when:**
- Need priority loading (load hero before thumbnails)
- Better cache control required
- GIF performance matters
- Large lists with many images (~100+ cards)

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: posterUrl,
    priority: FastImage.priority.high,  // Load before low-priority images
    cache: FastImage.cacheControl.immutable,  // Never re-fetch same URL
  }}
  style={{ width: 140, height: 200 }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

---

## Skeleton Loading

### Dimension Matching — Required

Skeleton dimensions **must exactly match** actual content to prevent layout shift:
```typescript
// Define sizes as constants, share between skeleton and real component
const CARD_WIDTH = 140;
const CARD_HEIGHT = 200;
const CARD_TITLE_HEIGHT = 20;

const SkeletonCard = () => (
  <View style={{ width: CARD_WIDTH }}>
    <View style={[styles.skeletonBlock, { height: CARD_HEIGHT }]} />
    <View style={[styles.skeletonBlock, { height: CARD_TITLE_HEIGHT, marginTop: 8 }]} />
  </View>
);

const AnimeCard = ({ anime }: { anime: Anime }) => (
  <View style={{ width: CARD_WIDTH }}>
    <Image style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} source={{ uri: anime.posterUrl }} />
    <Text style={{ height: CARD_TITLE_HEIGHT, marginTop: 8 }}>{anime.title}</Text>
  </View>
);
```

### Skeleton Count = initialNumToRender
```typescript
const INITIAL_RENDER = 10;

const MyListScreen = () => {
  const { data, isLoading } = useMyListQuery();

  if (isLoading) {
    return (
      <View>
        {Array.from({ length: INITIAL_RENDER }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      initialNumToRender={INITIAL_RENDER}  // Matches skeleton count → no jump
      renderItem={renderRow}
    />
  );
};
```

---

## NH5 List Patterns

### Continue Watching (Horizontal, Fixed Size)
```typescript
const CARD_WIDTH = 140;

<FlatList
  data={continueWatching}
  horizontal
  showsHorizontalScrollIndicator={false}
  keyExtractor={(item) => item.id.toString()}
  getItemLayout={(_, index) => ({
    length: CARD_WIDTH + 12,  // Width + gap
    offset: (CARD_WIDTH + 12) * index,
    index,
  })}
  renderItem={renderContinueWatchingCard}
  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
/>
```

### My List (Vertical, Swipeable Rows)
```typescript
<FlatList
  data={myList}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <SwipeableRow anime={item} onArchive={handleArchive} onDelete={handleDelete} />
  )}
  removeClippedSubviews={true}
  windowSize={10}
  maxToRenderPerBatch={10}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ItemSeparatorComponent={() => <View style={styles.separator} />}
/>
```

### Search Results (Variable Height, No getItemLayout)
```typescript
<FlatList
  data={searchResults}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => <SearchResultRow anime={item} />}
  windowSize={5}
  initialNumToRender={15}
  onEndReached={fetchNextPage}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
/>
```

---

## Performance Checklist

When creating or optimizing a list:

- [ ] `keyExtractor` uses stable unique IDs (not index)?
- [ ] All items same height? Add `getItemLayout`
- [ ] List >50 items? Set `removeClippedSubviews={true}`
- [ ] `renderItem` and card component memoized?
- [ ] Images prefetched for upcoming items?
- [ ] Skeleton dimensions match real content?
- [ ] Correct `resizeMode` for each image use case?
- [ ] `windowSize` tuned for list length?
- [ ] Infinite scroll? `onEndReached` + loading footer?

---

## Common Mistakes

❌ **Index as key** — Breaks reconciliation on reorder/insert
❌ **Inline renderItem** — Function recreated every render, kills memo
❌ **Missing getItemLayout** — Unnecessary measurements on scroll-to-index
❌ **Skeleton size mismatch** — Causes layout shift when data loads
❌ **Prefetching entire list upfront** — Memory bloat
❌ **Wrong resizeMode** — Distorted or cropped-wrong images
❌ **High windowSize on large lists** — Memory pressure, slow scrolling
❌ **Not memoizing card components** — Unnecessary re-renders in long lists
