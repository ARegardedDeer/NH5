# Quick Fix: PGRST203 Search Error

## TL;DR

Search broken with `PGRST203` error? Follow these 3 steps:

### 1. Run Migration 006

Copy/paste into Supabase SQL Editor:

```sql
-- File: docs/sql/migrations/006_force_drop_all_search_anime.sql
```

Expected output:
```
NOTICE: Success: All search_anime functions removed
NOTICE: Final count: 1 search_anime function(s) exist
```

### 2. Clear React Query Cache

Open Add Anime sheet → Click 🗑️ button (top-right, purple button)

Console should show:
```
[AddAnimeSheet] 🗑️ Cache cleared manually
```

### 3. Test Search

Type "naruto" in search box.

✅ **Success** - Console shows:
```
[useAnimeSearch] 🔍 Smart search for: naruto
[useAnimeSearch] ✅ Success after 42ms
[useAnimeSearch] Found 15 results
```

❌ **Still broken** - Console shows:
```
[useAnimeSearch] ❌ Error after 156ms
[useAnimeSearch] Error code: PGRST203
[useAnimeSearch] Full error object: { ... }
```

If still broken → See [DEBUGGING_SEARCH.md](./DEBUGGING_SEARCH.md) for detailed troubleshooting.

---

## What is PGRST203?

PostgREST can't decide which `search_anime()` function to call because multiple signatures exist:

```
public.search_anime()                    ← No parameters
public.search_anime(text)                ← Unnamed parameter
public.search_anime(search_term text)    ← Named parameter
```

Migration 006 drops all of them and creates exactly one.

---

## What is Cache Invalidation?

React Query caches API responses for 5 minutes. After running migration 006, the database function changes but React Query still returns **old cached results**.

The 🗑️ button forces React Query to discard old cache and fetch fresh results.

**Analogy:** Like refreshing a web page to see new content instead of cached version.

---

## Alternative: Restart Bundler

If 🗑️ button doesn't work, restart Metro bundler:

```bash
# Kill existing bundler
lsof -ti:8081 | xargs kill -9

# Start fresh
npx react-native start --reset-cache
```

Then rebuild app:
```bash
npm run ios
# or
npm run android
```

---

## Files Changed

- ✅ `src/hooks/useAnimeSearch.ts` - Enhanced logging
- ✅ `src/hooks/useInvalidateSearchCache.ts` - Cache clearing hooks
- ✅ `src/components/add-anime/AddAnimeSheet.tsx` - 🗑️ debug button
- ✅ `docs/sql/migrations/006_force_drop_all_search_anime.sql` - Fix overloads
- ✅ `docs/DEBUGGING_SEARCH.md` - Full documentation

---

## Production Cleanup

Before shipping:

1. **Remove 🗑️ button** from AddAnimeSheet (lines 143-152)
2. **Reduce logging** in useAnimeSearch (keep errors only)
3. **Keep cache hooks** (useful for future debugging)

---

## Need Help?

See [DEBUGGING_SEARCH.md](./DEBUGGING_SEARCH.md) for:
- Detailed cache invalidation explanation
- Full troubleshooting guide
- Migration 006 deep dive
- React Query configuration details
