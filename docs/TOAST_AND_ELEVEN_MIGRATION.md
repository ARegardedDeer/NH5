# Toast System & One 11/10 Per User Migration

## Summary

This migration adds two features:
1. **Global toast system** - Reliably renders above modals/scroll, callable from any screen
2. **One 11/10 per account** - Enforces single highlight per user at DB level

## Changes Applied

### Part 1: Global Toast System

**Files Created:**
- `src/ui/toast/ToastHost.tsx` - Toast provider and context

**Files Modified:**
- `src/App.tsx` - Wrapped with `<ToastProvider>`
- `src/features/anime/screens/AnimeDetailScreen.tsx` - Replaced inline toast with `useToast()` hook

**Features:**
- Toasts appear above all content (zIndex: 9999)
- Auto-hide after 1200ms (configurable)
- Smooth fade in/out animations
- No z-index conflicts with modals
- Uses existing Animated API (no new dependencies)

**Usage:**
```typescript
import { useToast } from '@/ui/toast/ToastHost';

const toast = useToast();
toast.show('Saved: 7.6/10');
toast.show('Rating cleared');
toast.show('Error saving rating');
```

### Part 2: One 11/10 Per Account

**Files Created:**
- `docs/migrations/one_eleven_per_user.sql` - Idempotent SQL migration

**Files Modified:**
- `src/features/rating/persistence.ts` - Updated `setElevenFlag` to delete by `user_id` only
- `src/features/anime/screens/AnimeDetailScreen.tsx` - Added toast feedback for all rating operations

**Database Changes:**
- `user_eleven` table: Changed PK from `(user_id, anime_id)` to `(user_id)` only
- `ratings` table: Changed `score_overall` to `numeric(3,1)` (supports decimals)
- Added constraint: `ratings_score_range` allows 1.0 to 11.0
- Added index: `idx_ratings_anime` for performance

**Business Logic:**
- Setting 11/10 on anime A, then setting 11/10 on anime B = only B is highlighted
- DB constraint guarantees one row per user in `user_eleven`
- Dragging from 11 to 1-10 automatically clears highlight flag
- Averages now include 11.0 values

## Migration Steps

### 1. Run SQL Migration

**IMPORTANT:** You must run this SQL in your Supabase SQL Editor before testing the app.

Copy the entire contents of `docs/migrations/one_eleven_per_user.sql` and run it in the Supabase SQL Editor.

The migration is idempotent (safe to run multiple times) and handles:
- Creating `user_eleven` table if missing
- Dropping old composite PK `(user_id, anime_id)`
- Adding new single-column PK `(user_id)`
- Changing `score_overall` to `numeric(3,1)`
- Updating check constraints to allow 11.0
- Adding performance index

### 2. Test the Changes

Restart the React Native app:
```bash
npm start -- --reset-cache
```

## Test Plan

### Toast System Tests

1. **Save rating toast:**
   - Open anime detail
   - Rate it 7.6/10
   - Verify "Saved: 7.6/10" toast appears above the modal
   - Toast should auto-hide after ~1.2 seconds

2. **Clear rating toast:**
   - Clear a rating
   - Verify "Rating cleared" toast appears

3. **Error toast:**
   - Turn off network/internet
   - Try to save a rating
   - Verify "Error saving rating" toast appears

4. **Z-index test:**
   - Open rating modal
   - Save a rating
   - Verify toast appears ABOVE the modal backdrop

### 11/10 Exclusivity Tests

1. **Single highlight enforcement:**
   - Set anime A as 11/10
   - Navigate to anime B
   - Set anime B as 11/10
   - Check Supabase `user_eleven` table → should have ONLY one row for your user (anime_id = B)
   - Return to anime A → rating badge should NOT show 11/10 highlight

2. **Drag from 11 test:**
   - Set anime as 11/10
   - Open rating modal
   - Drag slider to 8.4
   - Save
   - Check DB:
     - `user_eleven` → no row for your user
     - `ratings` → score_overall = 8.4

3. **Summary calculation:**
   - Create multiple ratings including 11.0
   - Verify anime summary shows correct average (11 included in calculation)

## Rollback Plan

If issues occur:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Revert DB schema (if needed):**
   ```sql
   -- Revert to old composite PK
   ALTER TABLE user_eleven DROP CONSTRAINT user_eleven_pkey;
   ALTER TABLE user_eleven ADD CONSTRAINT user_eleven_pkey PRIMARY KEY (user_id, anime_id);
   ```

## Files Reference

**Created:**
- [src/ui/toast/ToastHost.tsx](../src/ui/toast/ToastHost.tsx)
- [docs/migrations/one_eleven_per_user.sql](./migrations/one_eleven_per_user.sql)

**Modified:**
- [src/App.tsx](../src/App.tsx)
- [src/features/anime/screens/AnimeDetailScreen.tsx](../src/features/anime/screens/AnimeDetailScreen.tsx)
- [src/features/rating/persistence.ts](../src/features/rating/persistence.ts)

## Notes

- No new npm dependencies added
- All animations use React Native's built-in Animated API
- Toast positioning is fixed at bottom: 88 (above tab bar)
- Console logs retained for debugging (`[ratings] ...`)
- Existing styles and architecture preserved
