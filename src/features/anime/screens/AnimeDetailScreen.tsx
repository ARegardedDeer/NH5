import React from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAnimeById } from '../hooks/useAnimeById';

type RouteParams = { id: string; title?: string };

export default function AnimeDetailScreen() {
  const route = useRoute();
  const { id, title } = (route.params as RouteParams) || { id: '' };
  const { data, isLoading, error } = useAnimeById(id);

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
    </ScrollView>
  );
}
