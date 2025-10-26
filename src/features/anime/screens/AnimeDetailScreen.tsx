import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useAnimeById } from '../hooks/useAnimeById';
import { theme } from '../../../ui/theme';
import { supabase, whenAuthed } from '../../../db/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV = __DEV__;
const DEV_VERBOSE = __DEV__ && false; // flip to true for deep debugging
const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };
const STATUSES = ['Watching', 'On Hold', 'Completed', 'Dropped', 'Plan to Watch'] as const;

// Haptic feedback helper (best-effort)
const haptic = (type: 'light' | 'medium' | 'heavy') => {
  try {
    (globalThis as any)?.ReactNativeHaptic?.impact?.(type);
    if (DEV_VERBOSE) console.log('[ratings] haptic:', type);
  } catch {}
};

// Cache keys with version for safe invalidation (bump v1 -> v2 on schema changes)
const getUserListCacheKey = (animeId: string) => `nh5::user_list::${animeId}::v1`;
const getUserRatingCacheKey = (animeId: string) => `nh5::user_rating::${animeId}::v1`;

type StatusOption = (typeof STATUSES)[number];

type PersistPayload = {
  userId: string | null;
  animeId: string;
  bookmarked: boolean;
  status: StatusOption | null;
};

const normalizeStatus = (value: unknown): StatusOption | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/-/g, ' ').toLowerCase();
  return STATUSES.find((option) => option.toLowerCase() === normalized) ?? null;
};

async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user?.id ?? null;
}

type RouteParams = { id: string; title: string };

export default function AnimeDetailScreen() {
  const route = useRoute() as any;
  const { id, title } = (route.params || {}) as RouteParams;

  const { data, isLoading, error } = useAnimeById(id);

  const [bookmarked, setBookmarked] = useState(false);
  const [status, setStatus] = useState<StatusOption | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [hasUserListsTable, setHasUserListsTable] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [myRatingLoading, setMyRatingLoading] = useState(false);
  const [savingMyRating, setSavingMyRating] = useState(false);
  const [supportsUserRating, setSupportsUserRating] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ratingUIOpen, setRatingUIOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [railWidth, setRailWidth] = useState(0);

  const myRatingPrevRef = useRef<number | null>(null);
  const myRatingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const lastHapticValue = useRef<number>(0);
  const dragStartX = useRef(0);

  // Value <-> X position mapping helpers
  const valueToX = useCallback((value: number) => {
    if (!railWidth) return 0;
    const clamped = Math.max(1, Math.min(10, value));
    const pct = (clamped - 1) / 9; // 1..10 -> 0..1
    return pct * railWidth;
  }, [railWidth]);

  const xToValue = useCallback((x: number) => {
    if (!railWidth) return 5;
    const clampedX = Math.max(0, Math.min(railWidth, x));
    const pct = clampedX / railWidth;
    const value = 1 + (pct * 9); // 0..1 -> 1..10
    return Math.round(value * 10) / 10; // round to 0.1 precision
  }, [railWidth]);

  // Sync thumb position when myRating or railWidth changes
  useEffect(() => {
    if (!railWidth) return;
    const seed = myRating === 11 ? 10 : (myRating ?? 5);
    // No animation needed, just position sync
  }, [railWidth, myRating]);

  // PanResponder for draggable slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        setIsDragging(true);
        // Store starting X position
        const currentValue = myRating === 11 ? 10 : (myRating ?? 5);
        dragStartX.current = valueToX(currentValue);
      },
      onPanResponderMove: async (_, gestureState) => {
        if (railWidth === 0) return;

        // Calculate new X from drag delta
        const nextX = dragStartX.current + gestureState.dx;
        const newValue = xToValue(nextX);
        const clamped = Math.max(1.0, Math.min(10.0, newValue));

        // If user was at 11/10 and drags slider, clear the 11/10 flag (once)
        if (myRating === 11 && gestureState.dx !== 0) {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              await supabase.from('user_eleven').delete().eq('user_id', userId).eq('anime_id', id);
              if (DEV) console.log('[ratings] drag: cleared 11/10 flag');
            }
          } catch (e: any) {
            if (DEV) console.warn('[ratings] drag: failed to clear 11/10', e?.message ?? e);
          }
        }

        setMyRating(clamped);

        // Haptic every 0.5
        const halfStep = Math.round(clamped * 2);
        if (halfStep !== lastHapticValue.current) {
          haptic('light');
          lastHapticValue.current = halfStep;
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  useEffect(() => {
    setIsStoryExpanded(false);
  }, [data?.synopsis]);

  // Cleanup mounted ref and debounce on unmount
  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (myRatingDebounceRef.current) {
        clearTimeout(myRatingDebounceRef.current);
        myRatingDebounceRef.current = null;
      }
    },
    []
  );

  // Auth gate: wait for dev session to be ready
  useEffect(() => {
    let alive = true;
    if (DEV_VERBOSE) console.log('[auth] ui gate: waiting...');
    whenAuthed.finally(() => {
      if (!alive) return;
      setAuthReady(true);
      if (DEV_VERBOSE) console.log('[auth] ui gate: ready=true');
    });
    return () => { alive = false; };
  }, []);

  // Read cache immediately for instant render
  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(getUserListCacheKey(id))
      .then(cached => {
        if (cached) {
          const { bookmarked, status } = JSON.parse(cached);
          setBookmarked(!!bookmarked);
          setStatus(status ?? null);
          if (DEV_VERBOSE) console.log('[anime] cache hit:', { bookmarked, status });
        }
      })
      .catch(() => {});
  }, [id]);

  // Refactored loader: gate on authReady, load user_lists row
  const loadUserListRow = useCallback(async () => {
    if (!authReady) return;
    if (!id) return;

    const { data: user } = await supabase.auth.getUser();
    const currentUserId = user?.user?.id ?? null;
    setCurrentUserId(currentUserId);
    if (!currentUserId) return;

    const { data: rows, error } = await supabase
      .from('user_lists')
      .select('status,bookmarked')
      .eq('user_id', currentUserId)
      .eq('anime_id', id)
      .limit(1);

    if (DEV_VERBOSE) {
      console.log('[anime] load user_lists:', {
        userId: currentUserId,
        animeId: id,
        rows: rows?.length ?? 0,
        error: error?.message ?? 'none',
        data: rows?.[0] ?? null,
      });
    }

    if (rows && rows[0]) {
      setBookmarked(!!rows[0].bookmarked);
      setStatus(rows[0].status ?? null);
      setHasLoadedOnce(true);
      // Write cache for next time
      AsyncStorage.setItem(getUserListCacheKey(id), JSON.stringify({
        bookmarked: !!rows[0].bookmarked,
        status: rows[0].status ?? null,
      })).catch(() => {});
    } else {
      // no row: reflect defaults
      setBookmarked(false);
      setStatus(null);
      setHasLoadedOnce(true);
    }
  }, [authReady, id]);

  // Run loader when auth is ready, on id changes, and after writes (reloadKey)
  useEffect(() => {
    loadUserListRow();
  }, [loadUserListRow, reloadKey]);

  useEffect(() => {
    if (!authReady || !id) return;
    if (!supportsUserRating) {
      setMyRatingLoading(false);
      return;
    }
    if (!currentUserId) return;

    let alive = true;
    setMyRatingLoading(true);
    loadMyRating(currentUserId, id).then((result) => {
      if (!alive) return;
      setSupportsUserRating(result.supported);
      if (result.supported) {
        setMyRating(result.rating);
      }
      setMyRatingLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [authReady, currentUserId, id, loadMyRating, supportsUserRating]);

  useEffect(() => {
    if (!id) return;
    refreshSummary(id);
  }, [id, refreshSummary]);

  // keep exclusivity in UI

  const onPickMyRating = useCallback(
    (value: number) => {
      if (value < 1 || value > 10) return;
      if (!id) return;

      if (!supportsUserRating || !currentUserId) {
        setMyRating(value);
        if (DEV) console.log(`[ratings] upsert: persisted=false reason=schema score=${value}`);
        return;
      }

      if (myRatingDebounceRef.current) {
        clearTimeout(myRatingDebounceRef.current);
      }

      myRatingPrevRef.current = myRating;
      setMyRating(value);
      setSavingMyRating(true);

      const userId = currentUserId;
      myRatingDebounceRef.current = setTimeout(() => {
        (async () => {
          try {
            const { error } = await supabase
              .from('ratings')
              .upsert(
                {
                  user_id: userId,
                  anime_id: id,
                  score_overall: value,
                },
                { onConflict: 'user_id,anime_id' }
              );
            if (error) {
              const message = error.message || error.code || 'unknown';
              if (message.includes('column') && message.includes('user_id')) {
                if (DEV) console.log(`[ratings] upsert: persisted=false reason=schema score=${value}`);
                setSupportsUserRating(false);
                if (isMountedRef.current) {
                  setSavingMyRating(false);
                }
                return;
              }
              throw error;
            }
            if (DEV) console.log(`[ratings] upsert: persisted=true score=${value}`);
            await refreshSummary(id);
          } catch (err: any) {
            const message = err?.message ?? 'unknown';
            if (DEV) console.log(`[ratings] upsert: persisted=false score=${value} error=${message}`);
            if (isMountedRef.current) {
              setMyRating(myRatingPrevRef.current ?? null);
            }
          } finally {
            if (isMountedRef.current) {
              setSavingMyRating(false);
            }
          }
        })().finally(() => {
          myRatingDebounceRef.current = null;
        });
      }, 300);
    },
    [supportsUserRating, currentUserId, id, myRating, refreshSummary]
  );

  const persistUserList = useCallback(
    async ({ userId, animeId, bookmarked: nextBookmarked, status: nextStatus }: PersistPayload) => {
      if (!hasUserListsTable || !userId) return false;
      const payload = {
        user_id: userId,
        anime_id: animeId,
        status: nextStatus,
        bookmarked: nextBookmarked,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_lists')
        .upsert(payload, { onConflict: 'user_id,anime_id' });

      return !error;
    },
    [hasUserListsTable]
  );

  const loadMyRating = useCallback(async (userId: string, animeId: string) => {
    try {
      const { data: row, error } = await supabase
        .from('ratings')
        .select('score_overall')
        .eq('user_id', userId)
        .eq('anime_id', animeId)
        .maybeSingle();

      if (error) {
        const message = error.message || error.code || 'unknown';
        if (message.includes('column') && message.includes('user_id')) {
          if (DEV) console.log('[ratings] user: unsupported schema');
          if (DEV) console.log('[ratings] user: found=false score=none');
          return { rating: null, supported: false };
        }
        if (DEV) console.log(`[ratings] user: found=false score=none error=${message}`);
        return { rating: null, supported: true };
      }

      const score = typeof row?.score_overall === 'number' ? row.score_overall : null;
      if (DEV) console.log(`[ratings] user: found=${score !== null} score=${score ?? 'none'}`);
      return { rating: score, supported: true };
    } catch (err: any) {
      if (DEV) {
        const message = err?.message ?? 'unknown';
        console.log(`[ratings] user: found=false score=none error=${message}`);
      }
      return { rating: null, supported: true };
    }
  }, []);

  const refreshSummary = useCallback(
    async (animeId: string) => {
      try {
        const { data: rows, error } = await supabase
          .from('ratings')
          .select('score_overall')
          .eq('anime_id', animeId);
        if (error) throw error;
        const scores = (rows ?? [])
          .map((item: any) => (typeof item?.score_overall === 'number' ? item.score_overall : null))
          .filter((value): value is number => typeof value === 'number');
        const count = scores.length;
        const avg = count ? scores.reduce((sum, value) => sum + value, 0) / count : null;
        if (DEV) {
          const avgLabel = avg !== null ? avg.toFixed(1) : 'none';
          console.log(`[ratings] summary: count=${count} avg=${avgLabel}`);
        }
        setRatingSummary({ avg, count });
      } catch (err: any) {
        if (DEV) {
          const message = err?.message ?? 'unknown';
          console.log(`[ratings] summary: count=0 avg=none error=${message}`);
        }
      }
    },
    []
  );

  const onSetEleven = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert('Error', 'Could not determine user ID');
        return;
      }

      // Optimistic update
      myRatingPrevRef.current = myRating;
      setMyRating(11);
      setRatingUIOpen(false);

      // Write to both ratings (score=11) and user_eleven tables
      const { error: ratingError } = await supabase
        .from('ratings')
        .upsert(
          { user_id: userId, anime_id: id, score_overall: 11 },
          { onConflict: 'user_id,anime_id' }
        );

      if (ratingError) {
        const message = ratingError.message || ratingError.code || 'unknown';
        if (message.includes('column') && message.includes('user_id')) {
          if (DEV) console.log('[ratings] 11/10: persisted=false reason=schema score=11');
          setSupportsUserRating(false);
        } else {
          throw ratingError;
        }
      } else {
        if (DEV) console.log('[ratings] 11/10: persisted=true score=11');
      }

      const { error: elevenError } = await supabase
        .from('user_eleven')
        .upsert({ user_id: userId, anime_id: id }, { onConflict: 'user_id' });

      if (elevenError) throw elevenError;

      console.log('[profile] setEleven ok', { userId, animeId: id });
      await refreshSummary(id);
      Alert.alert('Saved', 'This is now your 11/10 highlight!');
    } catch (e: any) {
      // Rollback on error
      setMyRating(myRatingPrevRef.current);
      console.warn('[profile] setEleven error', e);
      Alert.alert('Error', 'Could not set 11/10.');
    }
  };

  const onToggleBookmark = useCallback(async () => {
    const next = !bookmarked;
    setBookmarked(next);
    setStatusMenuOpen(false);
    const userId = await getCurrentUserId();
    const persisted = await persistUserList({ userId, animeId: id, bookmarked: next, status });
    if (DEV) {
      const statusLabel = status ?? 'none';
      console.log(`[anime] lists: user=${userId ?? 'none'} anime=${id} op=toggle status=${statusLabel} persisted=${persisted}`);
    }
    if (persisted) {
      setReloadKey((k) => k + 1);
    }
  }, [bookmarked, id, persistUserList, status]);

  const onToggleStatusMenu = useCallback(() => {
    setStatusMenuOpen((prev) => !prev);
  }, []);

  const onSelectStatus = useCallback(
    async (next: StatusOption) => {
      setStatus(next);
      setStatusMenuOpen(false);
      const userId = await getCurrentUserId();
      const persisted = await persistUserList({ userId, animeId: id, bookmarked, status: next });
      if (DEV) {
        console.log(`[anime] status: set=${next}`);
        console.log(
          `[anime] lists: user=${userId ?? 'none'} anime=${id} op=status status=${next} persisted=${persisted}`
        );
      }
      if (persisted) {
        setReloadKey((k) => k + 1);
      }
    },
    [bookmarked, id, persistUserList]
  );

  const synopsis = typeof data?.synopsis === 'string' ? data.synopsis.trim() : '';
  const storyText = synopsis.length > 0 ? synopsis : 'Synopsis coming soon.';
  const shouldTruncateStory = storyText.length > 220;

  // DEV: inspect the raw tags shape coming from Supabase
  useEffect(() => {
    if (!DEV) return;
    const raw = (data as any)?.tags;
    const type = Array.isArray(raw) ? 'array' : typeof raw;
    const sample = typeof raw === 'string'
      ? raw.slice(0, 60)
      : Array.isArray(raw)
        ? String(raw[0] ?? '').slice(0, 60)
        : raw ? JSON.stringify(raw).slice(0, 60) : 'null';
    console.log('[anime] tags-raw:', { type, sample });
  }, [data?.tags]);

  const displayTags = useMemo(() => {
    const raw = (data as any)?.tags;
    const out: string[] = [];

    // split on common separators
    const splitTokens = (s: string) =>
      s.split(/[;,|/]/g).map(t => t.trim()).filter(Boolean);

    const pushMany = (input: unknown): void => {
      if (!input) return;
      if (Array.isArray(input)) {
        // handle arrays where elements could be strings or arrays
        input.forEach((item) => {
          const str = String(item ?? '').trim();
          if (!str) return;
          // if this element itself contains commas/semis/pipes, split it
          if (/[;,|/]/.test(str)) {
            out.push(...splitTokens(str));
          } else {
            out.push(str);
          }
        });
        return;
      }
      if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) return;
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            pushMany(parsed);
            return;
          }
        } catch {}
        out.push(...splitTokens(trimmed));
        return;
      }
      if (typeof input === 'object') {
        const candidate =
          (input as any).tags ?? (input as any).list ?? Object.values(input as Record<string, unknown>);
        pushMany(candidate);
      }
    };
    pushMany(raw);
    const deduped = Array.from(new Set(out.map((tag) => tag.trim()).filter(Boolean)));
    const top3 = deduped.slice(0, 3);
    return top3.length ? top3 : (DEV ? ['Drama', 'Action', 'Fantasy'] : []);
  }, [data]);

  useEffect(() => {
    if (!DEV) return;
    console.log('[anime] tags-ui:', { pills: displayTags?.length ?? 0 });
  }, [displayTags]);

  const yearLabel = useMemo(() => {
    if (!data?.air_date) return undefined;
    const maybeYear = new Date(data.air_date).getFullYear();
    return Number.isNaN(maybeYear) ? undefined : String(maybeYear);
  }, [data?.air_date]);

  const metadataItems = useMemo(() => {
    const items: string[] = [];
    if (yearLabel) items.push(yearLabel);
    if (data?.episodes_count) items.push(`Ep. ${data.episodes_count}`);
    return items;
  }, [yearLabel, data?.episodes_count]);

  const ratingAverageFromData = useMemo(() => {
    if (!data) return null;
    const keys = ['average_rating', 'rating_average', 'avg_rating', 'score_average'] as const;
    const found = keys
      .map((key) => {
        const value = (data as any)[key];
        return typeof value === 'number' ? value : null;
      })
      .find((value) => value !== null);
    return typeof found === 'number' ? found : null;
  }, [data]);

  const ratingCountFromData = useMemo(() => {
    if (!data) return null;
    const keys = ['ratings_count', 'rating_count', 'reviews_count'] as const;
    const found = keys
      .map((key) => {
        const value = (data as any)[key];
        return typeof value === 'number' ? value : null;
      })
      .find((value) => value !== null);
    return typeof found === 'number' ? found : null;
  }, [data]);

  const [ratingSummary, setRatingSummary] = useState<{ avg: number | null; count: number | null }>({
    avg: ratingAverageFromData,
    count: ratingCountFromData,
  });

  useEffect(() => {
    setRatingSummary({ avg: ratingAverageFromData, count: ratingCountFromData });
  }, [ratingAverageFromData, ratingCountFromData]);

  const ratingLabel = useMemo(() => {
    const avg = ratingSummary.avg;
    const count = ratingSummary.count;
    if (avg === null || Number.isNaN(avg)) return null;
    const formatted = avg >= 0 ? avg.toFixed(1) : avg.toString();
    if (typeof count !== 'number' || count === 0) return `⭐ ${formatted}`;
    const ratingWord = count === 1 ? 'rating' : 'ratings';
    return `⭐ ${formatted} · ${count} ${ratingWord}`;
  }, [ratingSummary]);

  const galleryItems = useMemo(() => {
    const uri = data?.thumbnail_url || null;
    return Array.from({ length: 3 }, () => uri);
  }, [data?.thumbnail_url]);

  const castMembers = useMemo(() => {
    if (!Array.isArray(data?.voice_actors)) return [];
    return (data.voice_actors as any[])
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') {
          return { name: entry };
        }
        if (typeof entry === 'object') {
          const name =
            entry.name ||
            entry.actor ||
            entry.full_name ||
            entry.displayName ||
            entry.character ||
            null;
          if (!name) return null;
          return {
            name: String(name),
            character: entry.character || entry.role || entry.as || null,
            avatar: entry.image_url || entry.avatar_url || entry.photo_url || null,
          };
        }
        return null;
      })
      .filter(Boolean) as { name: string; character?: string | null; avatar?: string | null }[];
  }, [data?.voice_actors]);

  const heroSource = data?.thumbnail_url ? { uri: data.thumbnail_url } : null;
  const bookmarkIcon = bookmarked ? '★' : '☆';
  const statusButtonLabel = status ?? 'Status';

  const statusControls = !authReady ? (
    <View style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <ActivityIndicator size="small" color="#A78BFA" />
    </View>
  ) : (
    <View style={{ position: 'relative', marginRight: 12 }}>
      <Pressable
        onPress={onToggleStatusMenu}
        hitSlop={HIT_SLOP}
        style={({ pressed }) => [
          { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{statusButtonLabel}</Text>
      </Pressable>
      {statusMenuOpen ? (
        <View
          style={{
            position: 'absolute',
            top: 44,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(12,11,23,0.92)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(167,139,250,0.45)',
            paddingVertical: 4,
            zIndex: 5,
            minWidth: 140,
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          {STATUSES.map((option) => (
            <Pressable
              key={option}
              onPress={() => onSelectStatus(option)}
              style={({ pressed }) => [
                { paddingVertical: 8, paddingHorizontal: 12 },
                pressed && { backgroundColor: 'rgba(167,139,250,0.18)' },
              ]}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>Loading anime…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.title}>Failed to load</Text>
          <Text style={styles.errorText}>{String(error)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
      >
        <View style={styles.hero}>
          {heroSource ? (
            <ImageBackground source={heroSource} style={styles.heroImage} imageStyle={styles.heroImageInner}>
              <View style={styles.heroOverlay} />
              <View style={styles.heroBottomFade} />
              <View style={styles.heroBottomOverlay} />
              <View style={styles.heroTopBar}>
                {statusControls}
                {!authReady ? (
                  <View style={[styles.iconButton, { alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="small" color="#A78BFA" />
                  </View>
                ) : (
                  <Pressable
                    onPress={onToggleBookmark}
                    hitSlop={HIT_SLOP}
                    style={({ pressed }) => [
                      styles.iconButton,
                      bookmarked && styles.iconButtonActive,
                      pressed && styles.iconButtonPressed,
                    ]}
                  >
                    <Text style={styles.iconButtonText}>{bookmarkIcon}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.heroBottom}>
                <View style={styles.titleShield}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  {metadataItems.length ? (
                    <View style={styles.heroMetaRow}>
                      {metadataItems.map((item, index) => (
                        <Text style={styles.heroMetaText} key={`${item}-${index}`}>
                          {item}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {displayTags.length ? (
                    <View style={styles.tagRow}>
                      {displayTags.slice(0, 3).map((tag, i) => (
                        <View key={`${tag}-${i}`} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {ratingLabel ? (
                    <View style={styles.ratingChip}>
                      <Text style={styles.ratingChipText}>{ratingLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]}>
              <View style={styles.heroOverlay} />
              <View style={styles.heroBottomFade} />
              <View style={styles.heroBottomOverlay} />
              <View style={styles.heroTopBar}>
                {statusControls}
                {!authReady ? (
                  <View style={[styles.iconButton, { alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="small" color="#A78BFA" />
                  </View>
                ) : (
                  <Pressable
                    onPress={onToggleBookmark}
                    hitSlop={HIT_SLOP}
                    style={({ pressed }) => [
                      styles.iconButton,
                      bookmarked && styles.iconButtonActive,
                      pressed && styles.iconButtonPressed,
                    ]}
                  >
                    <Text style={styles.iconButtonText}>{bookmarkIcon}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.heroBottom}>
                <View style={styles.titleShield}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  {metadataItems.length ? (
                    <View style={styles.heroMetaRow}>
                      {metadataItems.map((item, index) => (
                        <Text style={styles.heroMetaText} key={`${item}-${index}`}>
                          {item}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {displayTags.length ? (
                    <View style={styles.tagRow}>
                      {displayTags.slice(0, 3).map((tag, i) => (
                        <View key={`${tag}-${i}`} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {ratingLabel ? (
                    <View style={styles.ratingChip}>
                      <Text style={styles.ratingChipText}>{ratingLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.myRatingCard}
          onPress={() => setRatingUIOpen(true)}
          disabled={!authReady || myRatingLoading || savingMyRating}
          activeOpacity={0.7}
        >
          <View style={styles.myRatingHeader}>
            <Text style={styles.myRatingLabel}>My Rating</Text>
            <View style={styles.myRatingValue}>
              {savingMyRating ? (
                <ActivityIndicator size="small" color="#A78BFA" />
              ) : (
                <Text style={styles.myRatingValueText}>
                  {myRating === 11 ? '11/10' : myRating !== null ? myRating.toFixed(1) : '–'}
                </Text>
              )}
            </View>
          </View>
          {(!authReady || myRatingLoading) ? (
            <View style={styles.myRatingSpinner}>
              <ActivityIndicator size="small" color="#A78BFA" />
            </View>
          ) : (
            <Text style={styles.myRatingHint}>Tap to rate (1.0 - 10.0)</Text>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Story</Text>
          </View>
          <Text
            style={styles.sectionBody}
            numberOfLines={isStoryExpanded ? undefined : 4}
            ellipsizeMode="tail"
          >
            {storyText}
          </Text>
          {shouldTruncateStory ? (
            <Pressable style={styles.storyToggle} onPress={() => setIsStoryExpanded((prev) => !prev)}>
              <Text style={styles.storyToggleText}>{isStoryExpanded ? 'Show Less' : 'Read More'}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Gallery</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
            contentContainerStyle={styles.galleryContent}
          >
            {galleryItems.map((uri, index) => (
              <View style={styles.galleryItem} key={`gallery-${index}`}>
                {uri ? (
                  <Image source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
                ) : (
                  <View style={styles.galleryFallback}>
                    <Text style={styles.galleryFallbackText}>No image</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {castMembers.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Cast</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.castScroll}
              contentContainerStyle={styles.castContent}
            >
              {castMembers.map((member, index) => {
                const initials = member.name.trim().charAt(0).toUpperCase();
                return (
                  <View style={styles.castItem} key={`${member.name}-${index}`}>
                    <View style={styles.castAvatarWrapper}>
                      {member.avatar ? (
                        <Image source={{ uri: member.avatar }} style={styles.castAvatarImage} resizeMode="cover" />
                      ) : (
                        <Text style={styles.castAvatarText}>{initials || '?'}</Text>
                      )}
                    </View>
                    <Text style={styles.castName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    {member.character ? (
                      <Text style={styles.castRole} numberOfLines={1}>
                        {member.character}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}


        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Rating Slider Modal */}
      <Modal
        visible={ratingUIOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRatingUIOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate this anime</Text>
              <TouchableOpacity onPress={() => setRatingUIOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.elevenButton}
              onPress={onSetEleven}
            >
              <Text style={styles.elevenButtonText}>⭐ Set as 11/10 ⭐</Text>
            </TouchableOpacity>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>
                {myRating === 11 ? '11/10' : myRating !== null ? myRating.toFixed(1) : '–'}
              </Text>

              <View
                style={styles.sliderRail}
                onLayout={(e) => setRailWidth(e.nativeEvent.layout.width)}
              >
                {/* Gradient fill */}
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: myRating !== null && railWidth > 0
                        ? myRating === 11
                          ? '100%'
                          : `${((myRating - 1) / 9) * 100}%`
                        : '0%',
                    },
                  ]}
                />

                {/* Touch zones (91 invisible pressable zones for 0.1 increments) */}
                <View style={styles.sliderTouchZones}>
                  {Array.from({ length: 91 }, (_, idx) => {
                    const value = 1.0 + idx * 0.1;
                    return (
                      <Pressable
                        key={`zone-${idx}`}
                        style={styles.sliderTouchZone}
                        onPress={async () => {
                          const rounded = Math.round(value * 10) / 10;

                          // If user was at 11/10 and taps slider, clear the 11/10 flag
                          if (myRating === 11) {
                            try {
                              const userId = await getCurrentUserId();
                              if (userId) {
                                await supabase.from('user_eleven').delete().eq('user_id', userId).eq('anime_id', id);
                                if (DEV) console.log('[ratings] tap: cleared 11/10 flag');
                              }
                            } catch (e: any) {
                              if (DEV) console.warn('[ratings] tap: failed to clear 11/10', e?.message ?? e);
                            }
                          }

                          setMyRating(rounded);
                          // Haptic every 0.5
                          const halfStep = Math.round(rounded * 2);
                          if (halfStep !== lastHapticValue.current) {
                            haptic('light');
                            lastHapticValue.current = halfStep;
                          }
                        }}
                      />
                    );
                  })}
                </View>

                {/* Animated thumb with drag support */}
                {myRating !== null && railWidth > 0 ? (
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.sliderThumb,
                      {
                        left: myRating === 11
                          ? railWidth - 12
                          : ((myRating - 1) / 9) * railWidth - 12,
                        transform: [{ scale: isDragging ? 1.2 : 1 }],
                      },
                    ]}
                  />
                ) : null}
              </View>

              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>1.0</Text>
                <Text style={styles.sliderLabelText}>10.0</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setMyRating(null);
                  setRatingUIOpen(false);
                  // Optionally clear from DB here
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  if (myRating !== null) {
                    onPickMyRating(myRating);
                  }
                  setRatingUIOpen(false);
                }}
                disabled={myRating === null}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {myRating !== null ? 'Save' : 'Pick a rating'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast.visible ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.backgroundDark },
  scroll: { flex: 1 },
  content: { paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  errorText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  hero: { width: '100%', height: 360, marginBottom: 28 },
  heroImage: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroImageInner: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(5,4,15,0.7)',
  },
  heroBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroTopBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: { backgroundColor: 'rgba(167,139,250,0.3)', borderColor: '#A78BFA' },
  iconButtonPressed: { opacity: 0.85 },
  iconButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroBottom: { marginTop: 'auto' },
  titleShield: {
    backgroundColor: 'rgba(11,10,22,0.58)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  heroMetaText: { color: '#A4A2C1', fontSize: 13, marginRight: 10, marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 6, marginBottom: 12 },
  tagChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(167,139,250,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.55)',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  ratingChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,10,22,0.85)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.35)',
  },
  ratingChipText: { color: '#FACC15', fontSize: 13, fontWeight: '600' },
  heroFallback: { backgroundColor: 'rgba(255,255,255,0.05)' },
  myRatingCard: { paddingHorizontal: 16, marginBottom: 24 },
  myRatingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  myRatingLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  myRatingValue: { minWidth: 32, alignItems: 'flex-end' },
  myRatingValueText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  myRatingSpinner: { height: 32, justifyContent: 'center' },
  myRatingControls: { flexDirection: 'row', flexWrap: 'wrap' },
  myRatingChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  myRatingChipSelected: { backgroundColor: '#A78BFA', borderColor: '#A78BFA' },
  myRatingChipPressed: { opacity: 0.85 },
  myRatingChipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  myRatingDisabled: { opacity: 0.6 },
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeader: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionBody: { color: '#D7D6E7', fontSize: 14, lineHeight: 20 },
  storyToggle: { marginTop: 12 },
  storyToggleText: { color: '#A78BFA', fontWeight: '600', fontSize: 14 },
  galleryScroll: { marginHorizontal: -16 },
  galleryContent: { paddingHorizontal: 16 },
  galleryItem: {
    width: 140,
    height: 84,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  galleryImage: { width: '100%', height: '100%' },
  galleryFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  galleryFallbackText: { color: '#A4A2C1', fontSize: 12 },
  castScroll: { marginHorizontal: -16 },
  castContent: { paddingHorizontal: 16 },
  castItem: { alignItems: 'center', width: 88, marginRight: 16 },
  castAvatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  castAvatarImage: { width: '100%', height: '100%' },
  castAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  castName: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  castRole: { color: '#A4A2C1', fontSize: 11, marginTop: 2, textAlign: 'center' },
  ratingSection: { paddingHorizontal: 16, marginBottom: 40 },
  ratingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  highlightButton: {
    backgroundColor: '#A78BFA',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  highlightButtonPressed: { opacity: 0.9 },
  highlightButtonText: { color: '#0B0A16', fontWeight: '600', fontSize: 13 },
  bottomSpacer: { height: 32 },

  // New rating hint
  myRatingHint: {
    color: '#A1A1AA',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1A1825',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    color: '#A1A1AA',
    fontSize: 24,
    fontWeight: '300',
  },

  // 11/10 button
  elevenButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 2,
    borderColor: '#FBB024',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  elevenButtonText: {
    color: '#FBB024',
    fontSize: 16,
    fontWeight: '700',
  },

  // Slider styles
  sliderContainer: {
    marginBottom: 32,
  },
  sliderValue: {
    color: '#A78BFA',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  sliderRail: {
    height: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 4,
    position: 'relative',
    marginHorizontal: 12,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#A78BFA',
    borderRadius: 4,
  },
  sliderTouchZones: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -12,
    bottom: -12,
    flexDirection: 'row',
  },
  sliderTouchZone: {
    flex: 1,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginHorizontal: 12,
  },
  sliderLabelText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal buttons
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#A78BFA',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  modalButtonTextPrimary: {
    color: '#0B0A16',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '600',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#27243A',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});
