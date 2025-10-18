import React, { useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAnimeById } from '../hooks/useAnimeById';
import { useMyRating } from '../hooks/useMyRating';
import { RatingPicker } from '../components/RatingPicker';
import { theme } from '../../../ui/theme';

type RouteParams = { id: string; title?: string };

export default function AnimeDetailScreen() {
  const route = useRoute();
  const { id, title } = (route.params as RouteParams) || { id: '' };
  const { data, isLoading, error } = useAnimeById(id);
  const { ratingQuery, upsert } = useMyRating(id);
  const [localScore, setLocalScore] = useState<number | undefined>(undefined);
  const [localEleven, setLocalEleven] = useState<boolean | undefined>(undefined);

  const serverScore = ratingQuery.data?.score_overall ?? undefined;
  const serverEleven = !!ratingQuery.data?.is_eleven_out_of_ten;
  const effectiveScore = localScore ?? serverScore ?? null;
  const effectiveEleven = (localEleven ?? serverEleven) || effectiveScore === 11;

  const handleToggleEleven = () => {
    setLocalEleven(prev => {
      const current = prev ?? serverEleven;
      return !current;
    });
  };

  const handleSave = async () => {
    const score = effectiveScore;
    if (score == null || score < 1 || score > 10) {
      Alert.alert('Pick a score 1–10');
      return;
    }
    try {
      await upsert.mutateAsync({ score_overall: score, is_eleven_out_of_ten: effectiveEleven });
      setLocalScore(undefined);
      setLocalEleven(undefined);
      Alert.alert('Saved!', 'Your rating has been saved.');
    } catch (err: unknown) {
      console.error('[AnimeDetail] save error', err);
      let message = 'Failed to save rating';
      if (err && typeof err === 'object') {
        const errorObj = err as Record<string, unknown>;
        message =
          (typeof errorObj.message === 'string' && errorObj.message) ||
          (typeof errorObj.details === 'string' && errorObj.details) ||
          (typeof errorObj.hint === 'string' && errorObj.hint) ||
          JSON.stringify(err);
      } else if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert('Error', message);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Failed to load</Text>
        <Text selectable>{String(error || 'Not found')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {data.thumbnail_url ? (
        <Image
          source={{ uri: data.thumbnail_url }}
          style={{ width: '100%', height: 220, borderRadius: 16, backgroundColor: '#eee' }}
        />
      ) : null}
      <Text style={{ fontSize: 22, fontWeight: '800' }}>{data.title || title}</Text>
      <Text style={{ opacity: 0.8 }}>{(data.tags ?? []).join(' · ')}</Text>
      <Text style={{ opacity: 0.8 }}>
        {data.episodes_count != null ? `${data.episodes_count} episodes` : ''}
      </Text>
      <Text style={{ opacity: 0.8 }}>{data.air_date ? `Aired: ${data.air_date}` : ''}</Text>
      {Array.isArray(data.voice_actors) && data.voice_actors.length > 0 && (
        <Text style={{ opacity: 0.8 }}>VAs: {data.voice_actors.join(', ')}</Text>
      )}
      {data.synopsis ? <Text style={{ marginTop: 8, lineHeight: 20 }}>{data.synopsis}</Text> : null}
      <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 12 }} />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>Your Rating</Text>
          {ratingQuery.isFetching ? <ActivityIndicator size="small" /> : null}
        </View>
        <RatingPicker
          value={effectiveScore}
          onChange={setLocalScore}
          eleven={effectiveEleven}
          onToggleEleven={handleToggleEleven}
        />
        {ratingQuery.error ? (
          <Text style={{ color: 'red' }}>Failed to load rating. Try again later.</Text>
        ) : null}
        <Pressable
          onPress={handleSave}
          disabled={upsert.isPending}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            opacity: upsert.isPending ? 0.7 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{upsert.isPending ? 'Saving…' : 'Save Rating'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
