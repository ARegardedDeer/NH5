import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Image } from 'react-native';
import { useAnimeList } from '../hooks/useAnimeList';

export default function AnimeListScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useAnimeList();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, opacity: 0.7 }}>Loading anime…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Failed to load anime</Text>
        <Text selectable style={{ textAlign: 'center', opacity: 0.8 }}>
          {String((error as Error).message)}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item }) => (
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
          }}
        >
          {item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#f3f4f6' }}
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontWeight: '800' }}>NH</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>{item.title}</Text>
            <Text style={{ opacity: 0.7, marginTop: 4 }}>
              {(item.tags ?? []).slice(0, 3).join(' · ') || '—'}
            </Text>
            <Text style={{ opacity: 0.7, marginTop: 2 }}>
              {item.episodes_count != null ? `${item.episodes_count} eps` : ''}
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.7 }}>No anime yet.</Text>
      }
    />
  );
}
