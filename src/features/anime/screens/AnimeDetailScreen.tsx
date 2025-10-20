import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useAnimeById } from '../hooks/useAnimeById';
import { useMyRating } from '../hooks/useMyRating';
import { theme } from '../../../ui/theme';
import { RatingPicker } from '../components/RatingPicker';
import { supabase } from '../../../db/supabaseClient';
import { getCurrentUserId } from '../../../state/currentUser';

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

  useEffect(() => {
    setScore(initialScore);
    setIsEleven(initialEleven);
  }, [initialScore, initialEleven]);

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Button title="Set as 11/10" onPress={onSetEleven} />
        </View>

        {data?.thumbnail_url ? (
          <Image source={{ uri: data.thumbnail_url }} style={styles.poster} resizeMode="cover" />
        ) : null}

        <View style={styles.meta}>
          {!!data?.tags?.length && (
            <Text style={styles.metaText}>{(data.tags as string[]).join(', ')}</Text>
          )}
          {!!data?.episodes_count && (
            <Text style={styles.metaText}>{data.episodes_count} eps</Text>
          )}
          {!!data?.air_date && (
            <Text style={styles.metaText}>Aired: {String(data.air_date)}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Your Rating</Text>
        <RatingPicker
          score={score}
          eleven={isEleven}
          onPickScore={onPickScore}
          onToggleEleven={onToggleEleven}
          onSave={onSave}
          saving={ratingQuery.isFetching || upsertStatus.isPending}
        />

        {/* bottom spacer so buttons never hide */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.backgroundDark },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', flex: 1 },
  loadingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  errorText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  poster: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  meta: { gap: 4, marginBottom: 8 },
  metaText: { color: 'rgba(255,255,255,0.8)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
});
