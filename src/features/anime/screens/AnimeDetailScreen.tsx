import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';
import RewatchModal from '../../profile/components/RewatchModal';
import PrismaticText from '../../../components/PrismaticText';
import { ConfettiOverlay } from '../../../components/ConfettiOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AnimeDetailRouteProp } from '../../../types/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAnimeById } from '../hooks/useAnimeById';
import { theme } from '../../../ui/theme';
import { supabase, whenAuthed } from '../../../db/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RatingBadge, RatingSheet } from '../../../components/rating';
import { readUserRating, upsertUserRating, deleteUserRating, setElevenFlag, normalizeScore } from '../../rating/persistence';
import { useToast } from '../../../contexts/ToastContext';
import { EpisodeWidget } from '../../../components/EpisodeWidget';

const DEV = __DEV__;
const DEV_VERBOSE = __DEV__ && false; // flip to true for deep debugging
const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };
const STATUSES = ['Watching', 'Rewatching', 'Plan to Watch', 'On Hold', 'Completed', 'Dropped'] as const;

// Valid status transitions — "Completed is the floor" rule.
// Rewatching is conditionally added for non-Completed/Rewatching statuses when rewatch_count > 0.
const STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  'Plan to Watch': ['Watching', 'On Hold', 'Dropped'],
  'Watching':      ['Plan to Watch', 'On Hold', 'Completed', 'Dropped'],
  'On Hold':       ['Plan to Watch', 'Watching', 'Completed', 'Dropped'],
  'Completed':     ['Watching', 'On Hold', 'Rewatching'],
  'Rewatching':    ['On Hold', 'Completed'],
  'Dropped':       ['Plan to Watch', 'Watching', 'On Hold', 'Completed'],
};

// Haptic feedback helper (best-effort)
const haptic = (type: 'light' | 'medium' | 'heavy') => {
  try {
    (globalThis as any)?.ReactNativeHaptic?.impact?.(type);
    if (DEV_VERBOSE) console.log('[ratings] haptic:', type);
  } catch {}
};

// Cache keys with version for safe invalidation (bump v1 -> v2 on schema changes)
const getUserListCacheKey = (animeId: string) => `nh5::user_list::${animeId}::v1`;
const getUserRatingCacheKey = (animeId: string) => `nh5::user_rating::${animeId}::v2`;

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

export default function AnimeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<AnimeDetailRouteProp>();
  const { animeId, title } = route.params;
  const id = animeId;

  const { data, isLoading, error } = useAnimeById(id);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<StatusOption | null>(null);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState<number | null>(null);
  const [showRewatchModal, setShowRewatchModal] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [myRatingLoading, setMyRatingLoading] = useState(false);
  const [savingMyRating, setSavingMyRating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ratingUIOpen, setRatingUIOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Unified status button spring animation
  const btnScale = useSharedValue(1);
  const btnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const myRatingPrevRef = useRef<number | null>(null);
  const myRatingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

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
          const { status } = JSON.parse(cached);
          setStatus(status ?? null);
          if (DEV_VERBOSE) console.log('[anime] cache hit:', { status });
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
      .select('status,bookmarked,rewatch_count,current_episode,total_episodes')
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
      setStatus(rows[0].status ?? null);
      setRewatchCount(rows[0].rewatch_count ?? 0);
      setCurrentEpisode(rows[0].current_episode ?? 0);
      setTotalEpisodes(rows[0].total_episodes ?? null);
      setHasLoadedOnce(true);
      // Write cache for next time
      AsyncStorage.setItem(getUserListCacheKey(id), JSON.stringify({
        status: rows[0].status ?? null,
      })).catch(() => {});
    } else {
      // no row: reflect defaults
      setStatus(null);
      setRewatchCount(0);
      setCurrentEpisode(0);
      setTotalEpisodes(null);
      setHasLoadedOnce(true);
    }
  }, [authReady, id]);

  // Run loader when auth is ready, on id changes, and after writes (reloadKey)
  useEffect(() => {
    loadUserListRow();
  }, [loadUserListRow, reloadKey]);


  useEffect(() => {
    if (!authReady || !id) return;
    (async () => {
      const { data: got } = await supabase.auth.getUser();
      const uid = got?.user?.id;
      if (!uid) return;
      setMyRatingLoading(true);
      const val = await readUserRating({ uid, animeId: id });
      setMyRating(val ?? null);
      setMyRatingLoading(false);
      if (DEV) console.log('[ratings] load:', { uid: !!uid, animeId: id, val });
    })();
  }, [authReady, id]);

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

  useEffect(() => {
    if (!id) return;
    refreshSummary(id);
  }, [id, refreshSummary]);

  // keep exclusivity in UI

  const commitMyRating = useCallback(async (next: number | null) => {
    if (next === null) return;
    if (!authReady || !id) return;
    const { data: got } = await supabase.auth.getUser();
    const uid = got?.user?.id;
    if (!uid) return;

    const score = normalizeScore(next);
    myRatingPrevRef.current = myRating;
    setMyRating(score);
    setSavingMyRating(true);
    setRatingUIOpen(false);

    // If score is 11, use atomic RPC to handle both user_eleven + ratings
    if (score === 11) {
      const { error } = await supabase.rpc('nh5_set_eleven', { p_anime_id: id });
      if (error) {
        setMyRating(myRatingPrevRef.current ?? null);
        setSavingMyRating(false);
        showToast({ message: 'Error saving 11/10', type: 'error', duration: 3000 });
        if (DEV) console.warn('[ratings] eleven rpc error:', error.message);
        return;
      }
    } else {
      // For scores 1-10, use regular upsert and clear eleven flag if needed
      const res = await upsertUserRating({ uid, animeId: id, score });
      if (!res.ok) {
        setMyRating(myRatingPrevRef.current ?? null);
        setSavingMyRating(false);
        showToast({ message: 'Error saving rating', type: 'error', duration: 3000 });
        if (DEV) console.warn('[ratings] commit: persisted=false error=', res.error);
        return;
      }
    }

    if (DEV) console.log('[ratings] commit: persisted=true score=', score);
    showToast({ message: `Saved: ${score === 11 ? '11/10' : `${score}/10`}`, type: 'success', duration: 3000 });
    setSavingMyRating(false);
    setReloadKey(k => k + 1);
  }, [authReady, id, myRating, showToast]);

  const clearMyRating = useCallback(async () => {
    if (!authReady || !id) return;
    const { data: got } = await supabase.auth.getUser();
    const uid = got?.user?.id;
    if (!uid) return;

    setSavingMyRating(true);
    const del = await deleteUserRating({ uid, animeId: id });
    if (!del.ok && DEV) console.warn('[ratings] clear: error=', del.error);

    const f = await setElevenFlag({ uid, animeId: id, enabled: false });
    if (!f.ok && DEV) console.warn('[ratings] clear eleven error=', f.error);

    setMyRating(null);
    setSavingMyRating(false);
    setRatingUIOpen(false);
    showToast({ message: 'Rating cleared', type: 'info', duration: 3000 });
    setReloadKey(k => k + 1);
    if (DEV) console.log('[ratings] clear=1');
  }, [authReady, id, showToast]);

  const persistUserList = useCallback(
    async ({ userId, animeId, bookmarked: nextBookmarked, status: nextStatus }: PersistPayload) => {
      console.log('[anime] 🔄 persistUserList START:', {
        userId: userId ?? 'null',
        animeId,
        nextStatus,
        nextBookmarked,
      });

      if (!userId) {
        console.warn('[anime] ⚠️ Aborting: userId is required');
        return false;
      }

      try {
        // Fetch anime episodes_count for proper episode tracking
        console.log('[anime] 📡 Fetching anime data for episodes_count...');
        const { data: anime, error: animeError } = await supabase
          .from('anime')
          .select('episodes_count')
          .eq('id', animeId)
          .single();

        if (animeError) {
          console.error('[anime] ❌ Error fetching anime:', animeError);
          console.error('[anime] ❌ Error details:', JSON.stringify(animeError, null, 2));
          return false;
        }

        const episodesCount = anime?.episodes_count ?? null;
        console.log('[anime] ✅ Fetched anime:', { episodesCount });

        const now = new Date().toISOString();

        // Build payload with episode tracking based on status
        const payload: any = {
          user_id: userId,
          anime_id: animeId,
          status: nextStatus ?? 'Plan to Watch',
          bookmarked: nextBookmarked,
          updated_at: now,
        };

        // Add episode tracking columns based on status
        if (nextStatus === 'Watching') {
          payload.current_episode = 1;
          payload.total_episodes = episodesCount;
          payload.started_at = now;
          payload.last_watched_at = now;
        } else if (nextStatus === 'Rewatching') {
          // Reset progress to ep 1 for a fresh rewatch
          payload.current_episode = 1;
          payload.total_episodes = episodesCount;
          payload.last_watched_at = now;
        } else if (nextStatus === 'Plan to Watch') {
          payload.current_episode = 0;
          payload.total_episodes = episodesCount;
          payload.started_at = null;
          payload.last_watched_at = null;
        } else if (nextStatus === 'Completed') {
          payload.current_episode = episodesCount ?? 0;
          payload.total_episodes = episodesCount;
          payload.completed_at = now;
          payload.original_completed_at = now;
          payload.last_watched_at = now;
        } else if (nextStatus === 'On Hold' || nextStatus === 'Dropped') {
          // Keep existing current_episode - only update timestamp
          payload.last_watched_at = now;
        }

        console.log('[anime] 🏗️ Built payload:', payload);
        console.log('[anime] 💾 Upserting to database...');

        const { data, error } = await supabase
          .from('user_lists')
          .upsert(payload, { onConflict: 'user_id,anime_id' })
          .select()
          .single();

        if (error) {
          console.error('[anime] ❌ Upsert error:', error);
          console.error('[anime] ❌ Error message:', error?.message);
          console.error('[anime] ❌ Error details:', JSON.stringify(error, null, 2));
          return false;
        }

        console.log('[anime] ✅ SUCCESSFULLY PERSISTED:', data);
        console.log('[anime] ✅ Saved status:', data.status);
        console.log('[anime] ✅ Current episode:', data.current_episode);
        console.log('[anime] ✅ Total episodes:', data.total_episodes);
        console.log('[anime] ✅ Bookmarked:', data.bookmarked);

        // Invalidate continue watching cache to refresh UI
        console.log('[anime] 🔄 Invalidating continue-watching cache...');
        queryClient.invalidateQueries({
          queryKey: ['continue-watching', userId],
        });
        console.log('[anime] ✅ Cache invalidated');

        return true;
      } catch (error) {
        console.error('[anime] 💥 persistUserList EXCEPTION:', error);
        console.error('[anime] 💥 Exception details:', JSON.stringify(error, null, 2));
        return false;
      }
    },
    [queryClient]
  );

  const onSetEleven = useCallback(async () => {
    if (!authReady || !id) return;
    const { data: got } = await supabase.auth.getUser();
    const uid = got?.user?.id;
    if (!uid) return;

    // Optimistic UI update
    myRatingPrevRef.current = myRating;
    setMyRating(11);
    setSavingMyRating(true);
    setRatingUIOpen(false);

    // Atomic RPC call (handles both user_eleven + ratings in one transaction)
    const { error } = await supabase.rpc('nh5_set_eleven', { p_anime_id: id });

    if (error) {
      // Rollback optimistic UI on error
      setMyRating(myRatingPrevRef.current ?? null);
      setSavingMyRating(false);
      showToast({ message: 'Error saving 11/10', type: 'error', duration: 3000 });
      if (DEV) console.warn('[ratings] eleven rpc error:', error.message);
      return;
    }

    if (DEV) console.log('[ratings] eleven: persisted=true score=11');
    showToast({ message: 'Saved: 11/10', type: 'success', duration: 3000 });
    setSavingMyRating(false);
    setReloadKey(k => k + 1);
  }, [authReady, id, myRating, showToast]);

  const handleQuickAdd = useCallback(async () => {
    btnScale.value = withSequence(
      withSpring(1.08, { damping: 12, stiffness: 220 }),
      withSpring(1.0, { damping: 14, stiffness: 200 }),
    );
    HapticFeedback.trigger('impactMedium');
    setStatus('Plan to Watch');
    setTimeout(() => setStatusMenuOpen(true), 120);
    const persisted = await persistUserList({ userId: currentUserId, animeId: id, bookmarked: false, status: 'Plan to Watch' });
    if (!persisted) {
      setStatus(null);
    }
  }, [currentUserId, id, persistUserList]);

  const onToggleStatusMenu = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    btnScale.value = withSequence(
      withSpring(1.06, { damping: 12, stiffness: 220 }),
      withSpring(1.0, { damping: 14, stiffness: 200 }),
    );
    setStatusMenuOpen((prev) => !prev);
  }, []);

  const handleRemoveFromList = useCallback(async () => {
    setStatusMenuOpen(false);
    if (!currentUserId) return;
    const { error } = await supabase
      .from('user_lists')
      .delete()
      .eq('user_id', currentUserId)
      .eq('anime_id', id);
    if (!error) {
      setStatus(null);
      setRewatchCount(0);
    } else if (DEV) {
      console.warn('[anime] remove error:', error.message);
    }
  }, [currentUserId, id]);

  const onSelectStatus = useCallback(
    async (next: StatusOption) => {
      const wasCompleted = status === 'Completed';
      const wasRewatching = status === 'Rewatching';
      setStatus(next);
      setStatusMenuOpen(false);

      // Rewatching → Completed: increment rewatch_count
      if (wasRewatching && next === 'Completed') {
        const newCount = rewatchCount + 1;
        setRewatchCount(newCount);
        if (currentUserId) {
          await supabase
            .from('user_lists')
            .update({ rewatch_count: newCount })
            .eq('user_id', currentUserId)
            .eq('anime_id', id);
          queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
        }
      }

      const persisted = await persistUserList({ userId: currentUserId, animeId: id, bookmarked: false, status: next });
      if (DEV) {
        console.log(`[anime] status: set=${next}`);
        console.log(
          `[anime] lists: user=${currentUserId ?? 'none'} anime=${id} op=status status=${next} persisted=${persisted}`
        );
      }
      if (persisted) {
        setReloadKey((k) => k + 1);
        if (next === 'Completed' && !wasCompleted) {
          HapticFeedback.trigger('notificationSuccess');
          setShowConfetti(true);
        }
      }
    },
    [currentUserId, id, persistUserList, queryClient, rewatchCount, status]
  );

  const handleSaveRewatch = useCallback(async (count: number) => {
    setRewatchCount(count);
    setShowRewatchModal(false);
    if (!currentUserId) return;
    const { error } = await supabase
      .from('user_lists')
      .update({ rewatch_count: count })
      .eq('user_id', currentUserId)
      .eq('anime_id', id);
    if (error) {
      if (DEV) console.warn('[anime] rewatch update error:', error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    }
  }, [currentUserId, id, queryClient]);

  const onCompletedBadgePress = useCallback(() => {
    haptic('medium');
    setShowRewatchModal(true);
  }, []);

  // Called by EpisodeWidget when episode reaches totalEpisodes
  const handleEpisodeComplete = useCallback(() => {
    const wasRewatching = status === 'Rewatching';
    setStatus('Completed');
    if (wasRewatching) {
      const newCount = rewatchCount + 1;
      setRewatchCount(newCount);
    }
    HapticFeedback.trigger('notificationSuccess');
    setShowConfetti(true);
    setReloadKey((k) => k + 1);
  }, [rewatchCount, status]);

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

  const STATUS_ICONS: Record<string, string> = {
    'Plan to Watch': '📚',
    'Watching': '▶',
    'On Hold': '⏸',
    'Completed': '✓',
    'Rewatching': '🔄',
    'Dropped': '✕',
  };

  const badgeText = (count: number) => (
    <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(201,196,255,0.9)' }}>🎖 {count}×</Text>
  );

  const chevron = <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>▼</Text>;

  const renderUnifiedButtonLabel = () => {
    if (!status) {
      return <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>+ Add to List</Text>;
    }

    // Rewatching: always show prismatic "Rewatching" text + optional badge (display only)
    if (status === 'Rewatching') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <PrismaticText style={{ fontSize: 13, fontWeight: '600' }}>Rewatching</PrismaticText>
          {rewatchCount > 0 && badgeText(rewatchCount)}
          {chevron}
        </View>
      );
    }

    // All other statuses: icon + text + optional badge (display only) + ▼
    const icon = STATUS_ICONS[status] ?? '';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{icon} {status}</Text>
        {rewatchCount > 0 && status === 'Completed' && badgeText(rewatchCount)}
        {chevron}
      </View>
    );
  };

  const statusControls = !authReady ? (
    <View style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="small" color="#A78BFA" />
    </View>
  ) : (
    <View style={{ position: 'relative' }}>
      <Reanimated.View style={btnAnimatedStyle}>
        <Pressable
          onPress={status ? onToggleStatusMenu : handleQuickAdd}
          hitSlop={HIT_SLOP}
          style={({ pressed }) => [
            {
              borderRadius: 18,
              borderBottomLeftRadius: statusMenuOpen ? 0 : 18,
              borderBottomRightRadius: statusMenuOpen ? 0 : 18,
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: statusMenuOpen ? 'rgba(12,11,23,0.97)' : 'rgba(0,0,0,0.55)',
              borderWidth: 1,
              borderBottomWidth: statusMenuOpen ? 0 : 1,
              borderColor: status === 'Rewatching' ? 'rgba(167,139,250,0.6)' : statusMenuOpen ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.24)',
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          {renderUnifiedButtonLabel()}
        </Pressable>
      </Reanimated.View>
      {statusMenuOpen ? (
        <Reanimated.View
          entering={FadeInDown.duration(160).easing(Easing.out(Easing.quad))}
          style={{
            position: 'absolute',
            top: 36,
            right: 0,
            backgroundColor: 'rgba(12,11,23,0.97)',
            borderRadius: 12,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: 'rgba(167,139,250,0.45)',
            paddingVertical: 4,
            zIndex: 20,
            minWidth: 190,
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          {STATUSES.filter((option) => {
            const allowed = STATUS_TRANSITIONS[status ?? ''] ?? [];
            if (!allowed.includes(option)) return false;
            // Rewatching requires prior completion for non-Completed/Rewatching statuses
            if (option === 'Rewatching' && status !== 'Completed' && status !== 'Rewatching' && rewatchCount === 0) return false;
            return true;
          }).map((option) => (
            <Pressable
              key={option}
              onPress={() => { onSelectStatus(option); setStatusMenuOpen(false); }}
              style={({ pressed }) => [
                { paddingVertical: 10, paddingHorizontal: 14 },
                pressed && { backgroundColor: 'rgba(167,139,250,0.18)' },
              ]}
            >
              {option === 'Rewatching' ? (
                <PrismaticText style={{ fontSize: 13, fontWeight: '600' }}>{option}</PrismaticText>
              ) : (
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{STATUS_ICONS[option]} {option}</Text>
              )}
            </Pressable>
          ))}
          {rewatchCount > 0 && (
            <>
              <View style={{ height: 1, backgroundColor: 'rgba(167,139,250,0.2)', marginVertical: 4 }} />
              <Pressable
                onPress={() => { setStatusMenuOpen(false); setShowRewatchModal(true); }}
                style={({ pressed }) => [{ paddingVertical: 10, paddingHorizontal: 14 }, pressed && { backgroundColor: 'rgba(167,139,250,0.18)' }]}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>🎖 Edit Rewatch Count</Text>
              </Pressable>
            </>
          )}
          <View style={{ height: 1, backgroundColor: 'rgba(167,139,250,0.2)', marginVertical: 4 }} />
          <Pressable
            onPress={() => { setStatusMenuOpen(false); handleRemoveFromList(); }}
            style={({ pressed }) => [{ paddingVertical: 10, paddingHorizontal: 14 }, pressed && { backgroundColor: 'rgba(167,139,250,0.18)' }]}
          >
            <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '600' }}>Remove from List</Text>
          </Pressable>
        </Reanimated.View>
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
      >
        <View style={styles.hero}>
          {heroSource ? (
            <ImageBackground source={heroSource} style={styles.heroImage} imageStyle={styles.heroImageInner}>
              <View style={styles.heroOverlay} />
              <View style={styles.heroBottomFade} />
              <View style={styles.heroBottomOverlay} />
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={HIT_SLOP}
                style={styles.backButton}
              >
                <Text style={styles.backButtonIcon}>✕</Text>
              </Pressable>
              <View style={styles.heroTopBar}>
                {statusControls}
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
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={HIT_SLOP}
                style={styles.backButton}
              >
                <Text style={styles.backButtonIcon}>✕</Text>
              </Pressable>
              <View style={styles.heroTopBar}>
                {statusControls}
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

        <RatingBadge
          value={myRating}
          loading={!authReady || myRatingLoading}
          onPress={() => setRatingUIOpen(true)}
        />

        <EpisodeWidget
          animeId={id}
          currentEpisode={currentEpisode}
          totalEpisodes={totalEpisodes}
          status={status}
          userId={currentUserId}
          onComplete={handleEpisodeComplete}
          onEpisodeChange={setCurrentEpisode}
        />

        {rewatchCount > 0 && (
          <Pressable
            onPress={onCompletedBadgePress}
            style={({ pressed }) => [styles.completedBadge, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.completedBadgeText}>🎖 {rewatchCount}×</Text>
            <Text style={styles.completedBadgeChevron}>›</Text>
          </Pressable>
        )}

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

      <RewatchModal
        visible={showRewatchModal}
        initialCount={rewatchCount}
        onSave={handleSaveRewatch}
        onCancel={() => setShowRewatchModal(false)}
      />

      <ConfettiOverlay visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Rating Sheet Component */}
      <RatingSheet
        visible={ratingUIOpen}
        value={myRating}
        onClose={() => setRatingUIOpen(false)}
        onChange={async (liveValue) => {
          if (myRating === 11 && liveValue !== null && liveValue < 11) {
            // Clear eleven flag when dragging from 11 to 1-10
            const { data: got } = await supabase.auth.getUser();
            const uid = got?.user?.id;
            if (uid) {
              await setElevenFlag({ uid, animeId: id, enabled: false });
              if (DEV) console.log('[ratings] drag: cleared 11/10 flag');
            }
          }
        }}
        onCommit={commitMyRating}
        onClear={clearMyRating}
        onSetEleven={onSetEleven}
        saving={savingMyRating}
        allowEleven
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,196,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,196,255,0.35)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    gap: 8,
  },
  completedBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(201,196,255,0.9)',
  },
  completedBadgeChevron: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
  },
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
  heroTopBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', zIndex: 10 },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
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
  sliderWrapper: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  sliderRail: {
    height: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 4,
    position: 'relative',
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
});
