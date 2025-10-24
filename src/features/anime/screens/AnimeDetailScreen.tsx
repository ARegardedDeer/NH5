import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useAnimeById } from '../hooks/useAnimeById';
import { useMyRating } from '../hooks/useMyRating';
import { theme } from '../../../ui/theme';
import { RatingPicker } from '../components/RatingPicker';
import { supabase, whenAuthed } from '../../../db/supabaseClient';

const DEV = __DEV__;
const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };
const STATUSES = ['Watching', 'On Hold', 'Completed', 'Dropped', 'Plan to Watch'] as const;

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
  const { ratingQuery, upsert, upsertStatus } = useMyRating(id);

  // local form state (mutually exclusive)
  const initialScore = ratingQuery.data?.score_overall ?? null;
  const initialEleven = !!ratingQuery.data?.is_eleven_out_of_ten;

  const [score, setScore] = useState<number | null>(initialScore);
  const [isEleven, setIsEleven] = useState<boolean>(initialEleven);
  const [bookmarked, setBookmarked] = useState(false);
  const [status, setStatus] = useState<StatusOption | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [hasUserListsTable, setHasUserListsTable] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setScore(initialScore);
    setIsEleven(initialEleven);
  }, [initialScore, initialEleven]);

  useEffect(() => {
    setIsStoryExpanded(false);
  }, [data?.synopsis]);

  // Auth gate: wait for dev session to be ready
  useEffect(() => {
    let alive = true;
    if (DEV) console.log('[auth] ui gate: waiting...');
    whenAuthed.finally(() => {
      if (!alive) return;
      setAuthReady(true);
      if (DEV) console.log('[auth] ui gate: ready=true');
    });
    return () => { alive = false; };
  }, []);

  // Refactored loader: gate on authReady, load user_lists row
  const loadUserListRow = useCallback(async () => {
    if (!authReady) return;
    if (!id) return;

    const { data: user } = await supabase.auth.getUser();
    const currentUserId = user?.user?.id ?? null;
    if (!currentUserId) return;

    const { data: rows, error } = await supabase
      .from('user_lists')
      .select('status,bookmarked')
      .eq('user_id', currentUserId)
      .eq('anime_id', id)
      .limit(1);

    if (DEV) {
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
    } else {
      // no row: reflect defaults
      setBookmarked(false);
      setStatus(null);
    }
  }, [authReady, id]);

  // Run loader when auth is ready, on id changes, and after writes (reloadKey)
  useEffect(() => {
    loadUserListRow();
  }, [loadUserListRow, reloadKey]);

  // keep exclusivity in UI
  const onPickScore = (n: number) => {
    setIsEleven(false);
    setScore(n);
  };
  const onToggleEleven = () => {
    setIsEleven((prev) => {
      const next = !prev;
      if (next) setScore(null);
      return next;
    });
  };

  const canSave = useMemo(() => isEleven || (score !== null && score >= 1 && score <= 10), [isEleven, score]);

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

  const onSave = async () => {
    if (!canSave) {
      Alert.alert('Pick a rating', 'Choose 1–10 or 11/10.');
      return;
    }
    const payload = {
      score_overall: isEleven ? null : score,
      is_eleven_out_of_ten: isEleven,
    } as { score_overall: number | null; is_eleven_out_of_ten: boolean };

    try {
      const { error: e } = await upsert(payload);
      if (e) {
        console.error('[AnimeDetail] save error', e);
        Alert.alert('Error', e.message || e.details || 'Failed to save rating');
        return;
      }
      Alert.alert('Saved', isEleven ? 'Marked as 11/10' : `Saved ${score}/10`);
    } catch (err: any) {
      console.error('[AnimeDetail] save exception', err);
      Alert.alert('Error', err?.message || 'Failed to save rating');
    }
  };

  const onSetEleven = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert('Error', 'Could not determine user ID');
        return;
      }
      const { error } = await supabase
        .from('user_eleven')
        .upsert({ user_id: userId, anime_id: id }, { onConflict: 'user_id' });
      if (error) throw error;
      console.log('[profile] setEleven ok', { userId, animeId: id });
      Alert.alert('Saved', 'This is now your 11/10 highlight!');
    } catch (e: any) {
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
    console.log('[anime] tags-ui:', { pills: displayTags.length, tags: displayTags });
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

  const ratingAverage = useMemo(() => {
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

  const ratingCount = useMemo(() => {
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

  const ratingLabel = useMemo(() => {
    if (ratingAverage === null) return null;
    const formatted = ratingAverage >= 0 ? ratingAverage.toFixed(1) : ratingAverage.toString();
    if (ratingCount === null) return `⭐ ${formatted}`;
    return `⭐ ${formatted} (${ratingCount})`;
  }, [ratingAverage, ratingCount]);

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

  const statusControls = (
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
      >
        <View style={styles.hero}>
          {heroSource ? (
            <ImageBackground source={heroSource} style={styles.heroImage} imageStyle={styles.heroImageInner}>
              <View style={styles.heroOverlay} />
              <View style={styles.heroBottomFade} />
              <View style={styles.heroBottomOverlay} />
              <View style={styles.heroTopBar}>
                {statusControls}
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

        <View style={styles.ratingSection}>
          <View style={styles.ratingHeader}>
            <Text style={styles.sectionHeader}>Your Rating</Text>
            <Pressable
              onPress={onSetEleven}
              hitSlop={HIT_SLOP}
              style={({ pressed }) => [styles.highlightButton, pressed && styles.highlightButtonPressed]}
            >
              <Text style={styles.highlightButtonText}>Set as 11/10</Text>
            </Pressable>
          </View>
          <RatingPicker
            score={score}
            eleven={isEleven}
            onPickScore={onPickScore}
            onToggleEleven={onToggleEleven}
            onSave={onSave}
            saving={ratingQuery.isFetching || upsertStatus.isPending}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
});
