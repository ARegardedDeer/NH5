# Debugging Search Issues

## Overview

This document explains the debugging features added to help diagnose and fix search-related issues, particularly the PGRST203 function overloading error.

---

## What is Cache Invalidation?

### The Problem

React Query (TanStack Query) caches API responses to improve performance and reduce unnecessary network requests. When you search for "naruto", the results are cached for 5 minutes (`staleTime: 5 * 60 * 1000`).

**Example Timeline:**
1. **10:00 AM** - Search "naruto" → API call → Returns `[{id, title, tags, ...}]` → **Cached**
2. **10:02 AM** - Search "naruto" again → **No API call** → Returns cached results
3. **10:05 AM** - You run migration 006 that changes `search_anime()` function
4. **10:06 AM** - Search "naruto" again → **Still returns OLD cached results** ❌
5. **10:07 AM** - Click 🗑️ cache button → Cache cleared
6. **10:08 AM** - Search "naruto" again → **Fresh API call** → Returns new results ✅

### Why Cache Causes Issues

When the database `search_anime()` function changes (via migrations), the API response shape or behavior changes, but React Query still serves **OLD cached results** until the cache expires (5 minutes).

**Common scenarios:**
- Migration changes `tags` → `genres` in return type
- Migration fixes function overloading (PGRST203 error)
- Migration adds fuzzy matching or full-text search
- Migration changes parameter names or types

### The Solution

**Cache Invalidation** forces React Query to:
1. Mark cached data as "stale" (outdated)
2. Discard old cache entries
3. Re-fetch from the API on the next query
4. Replace old cache with fresh data

---

## Features Added

### 1. Enhanced Debug Logging in `useAnimeSearch.ts`

**What it does:**
- Logs every search query with emoji indicators (🔍, ✅, ❌)
- Measures and logs response time in milliseconds
- Logs full error details when RPC calls fail
- Shows result count and first result shape

**Example console output:**

```
[useAnimeSearch] 🔍 Smart search for: naruto
[useAnimeSearch] 📡 Calling RPC with params: { search_term: "naruto" }
[useAnimeSearch] ❌ Error after 156ms
[useAnimeSearch] Error code: PGRST203
[useAnimeSearch] Error message: Could not choose the best candidate function between: public.search_anime(search_term => text), publ...
[useAnimeSearch] Error details: null
[useAnimeSearch] Error hint: Try renaming the parameters or the function itself in the database so function overloading can be resolved
[useAnimeSearch] Full error object: { ... }
```

**Success output:**

```
[useAnimeSearch] 🔍 Smart search for: naruto
[useAnimeSearch] 📡 Calling RPC with params: { search_term: "naruto" }
[useAnimeSearch] ✅ Success after 42ms
[useAnimeSearch] Found 15 results
[useAnimeSearch] Top result: Naruto
[useAnimeSearch] First result shape: ["id", "title", "thumbnail_url", "genres", "synopsis", "episodes_count"]
```

### 2. Cache Invalidation Hooks

**File:** `src/hooks/useInvalidateSearchCache.ts`

Two hooks are provided:

#### `useInvalidateSearchCache()`

Invalidates anime search caches (specific query or all queries).

**Usage:**

```typescript
import { useInvalidateSearchCache } from '../../hooks/useInvalidateSearchCache';

const invalidateCache = useInvalidateSearchCache();

// Clear ALL search caches
invalidateCache();

// Clear only "naruto" search cache
invalidateCache('naruto');
```

#### `useResetQueryCache()`

**Nuclear option** - Clears **ALL** React Query caches (not just search).

**Usage:**

```typescript
import { useResetQueryCache } from '../../hooks/useInvalidateSearchCache';

const resetCache = useResetQueryCache();

// Clear everything (use with caution)
resetCache();
```

**When to use:**
- `invalidateQueries()` doesn't work (rare edge cases)
- You need to reset the entire query client state
- Testing scenarios where you want a fresh start

### 3. UI Cache Clear Button

**Location:** Add Anime Sheet header (right side, next to close button)

**What it looks like:**
- 🗑️ emoji button with purple background (`#7C3AED`)
- Located between title and close button

**How to use:**
1. Open Add Anime sheet (tap FAB + icon)
2. Click 🗑️ button in top-right
3. Console logs: `[AddAnimeSheet] 🗑️ Cache cleared manually`
4. Next search will fetch fresh results from API

**When to use:**
- After running database migrations
- When search results seem stale or incorrect
- When debugging PGRST203 or similar errors
- When testing new search function implementations

---

## Troubleshooting PGRST203 Error

### Error Message

```
Could not choose the best candidate function between:
  public.search_anime(search_term => text),
  public.search_anime(text),
  public.search_anime()
```

### Root Cause

Multiple `search_anime()` function signatures exist in the database, and PostgREST cannot determine which one to call when you use `.rpc('search_anime', { search_term: 'query' })`.

### Solution Steps

1. **Run Migration 006:**

   Copy contents of `docs/sql/migrations/006_force_drop_all_search_anime.sql` and run in Supabase SQL Editor.

   This migration:
   - Drops ALL `search_anime()` overloads with CASCADE
   - Verifies all functions are removed
   - Creates single canonical function
   - Grants permissions to authenticated/anon roles
   - Verifies exactly 1 function exists

2. **Clear React Query Cache:**

   Option A: Click 🗑️ button in Add Anime sheet
   Option B: Restart React Native bundler

3. **Verify Fix:**

   - Open Add Anime sheet
   - Type a search query (e.g., "naruto")
   - Check console logs for:
     ```
     [useAnimeSearch] ✅ Success after XXms
     [useAnimeSearch] Found X results
     ```

4. **If Still Broken:**

   Check console for full error details:
   ```
   [useAnimeSearch] Error code: PGRST203
   [useAnimeSearch] Full error object: { ... }
   ```

   Possible issues:
   - Migration didn't run successfully (check Supabase logs)
   - Function exists in different schema (not `public`)
   - PostgREST schema cache needs refresh (restart Supabase project)

---

## React Query Cache Configuration

Current settings in `useAnimeSearch.ts`:

```typescript
{
  queryKey: ['anime-search', debouncedQuery],
  enabled: enabled && debouncedQuery.length >= 2,
  staleTime: 5 * 60 * 1000,    // Cache considered fresh for 5 minutes
  gcTime: 5 * 60 * 1000,        // Keep in cache for 5 minutes (formerly cacheTime)
  retry: 1,                     // Only retry once on failure (default is 3)
  retryDelay: 1000,            // Wait 1 second before retry
}
```

### Cache Behavior

- **staleTime (5 min):** Results cached for 5 minutes. No API call if searched again within this window.
- **gcTime (5 min):** Cache garbage collected after 5 minutes of inactivity.
- **retry (1):** Only retry once on error instead of 3 times (faster failure detection).
- **retryDelay (1s):** Wait 1 second before retry.

### Adjusting Cache for Development

If you want to **always fetch fresh** during development:

```typescript
staleTime: 0,        // Always consider stale (always re-fetch)
gcTime: 0,           // Never cache
retry: 0,            // Don't retry on error
```

**Note:** Don't commit these settings to production - they'll hurt performance.

---

## Migration 006 Explanation

**File:** `docs/sql/migrations/006_force_drop_all_search_anime.sql`

### What It Does

1. **Aggressive DROP CASCADE:**
   ```sql
   DROP FUNCTION IF EXISTS public.search_anime() CASCADE;
   DROP FUNCTION IF EXISTS public.search_anime(text) CASCADE;
   DROP FUNCTION IF EXISTS public.search_anime(search_term text) CASCADE;
   DROP FUNCTION IF EXISTS public.search_anime(varchar) CASCADE;
   DROP FUNCTION IF EXISTS public.search_anime(search_term varchar) CASCADE;
   ```

   - Drops all possible overload combinations
   - `CASCADE` removes even if other objects depend on it
   - Covers both `text` and `varchar` parameter types

2. **Verification Block (Before):**
   ```sql
   SELECT COUNT(*) INTO func_count
   FROM pg_proc
   WHERE proname = 'search_anime';
   ```

   - Queries PostgreSQL system catalog (`pg_proc`)
   - Counts remaining `search_anime` functions
   - Logs warning if any still exist

3. **Create Single Function:**
   ```sql
   CREATE FUNCTION public.search_anime(search_term text)
   RETURNS TABLE (...)
   LANGUAGE sql
   STABLE
   SECURITY DEFINER
   ```

   - Single canonical signature: `search_term text`
   - `STABLE`: Function doesn't modify database (optimization)
   - `SECURITY DEFINER`: Runs with creator's privileges (bypass RLS)

4. **Grant Permissions:**
   ```sql
   GRANT EXECUTE ON FUNCTION public.search_anime(text) TO authenticated;
   GRANT EXECUTE ON FUNCTION public.search_anime(text) TO anon;
   ```

   - Allows authenticated users to call function
   - Allows anonymous users to call function

5. **Verification Block (After):**
   ```sql
   IF func_count != 1 THEN
     RAISE EXCEPTION 'Expected exactly 1 search_anime function, found %', func_count;
   END IF;
   ```

   - Ensures exactly 1 function exists
   - Migration fails if count isn't 1 (safety check)

---

## Testing Your Fix

### 1. Run Migration 006

```sql
-- Copy/paste into Supabase SQL Editor
-- Should see:
-- NOTICE: Success: All search_anime functions removed
-- NOTICE: Final count: 1 search_anime function(s) exist
```

### 2. Clear Cache

Click 🗑️ button in Add Anime sheet or restart bundler.

### 3. Test Search

Open Add Anime sheet and search for "naruto". Console should show:

```
[useAnimeSearch] 🔍 Smart search for: naruto
[useAnimeSearch] 📡 Calling RPC with params: { search_term: "naruto" }
[useAnimeSearch] ✅ Success after 42ms
[useAnimeSearch] Found 15 results
[useAnimeSearch] Top result: Naruto
```

### 4. Verify Results

- Search results should display with genres (not tags)
- Save/Start buttons should work
- No PGRST203 errors in console

---

## Production Cleanup

Before shipping to production:

1. **Remove debug button** from AddAnimeSheet:
   - Delete 🗑️ cache button (lines 143-152)
   - Restore simple header with just close button

2. **Reduce logging** in useAnimeSearch:
   - Keep error logging
   - Remove success logging or reduce verbosity

3. **Keep cache hooks** - useful for user-triggered cache refresh if needed

4. **Restore cache settings:**
   ```typescript
   staleTime: 5 * 60 * 1000,  // Keep 5 minutes
   gcTime: 5 * 60 * 1000,     // Keep 5 minutes
   retry: 3,                  // Restore default retry count
   ```

---

## Summary

**Cache invalidation** ensures fresh data after database changes. The debugging features added:

- ✅ **Enhanced logging** - See exactly what's happening with searches
- ✅ **Cache clear hooks** - Programmatically invalidate caches
- ✅ **UI debug button** - Easy cache clearing during development
- ✅ **Migration 006** - Aggressively fixes function overloading

These tools make it easy to diagnose and fix search issues without waiting for caches to expire.
