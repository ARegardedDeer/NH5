import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, RefreshControl, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../../db/supabaseClient';

type Row = {
  id: string;
  title: string;
  tags: string[] | null;
  episodes_count: number | null;
  thumbnail_url: string | null;
};

type DiscoverStackParamList = {
  DiscoverList: undefined;
  AnimeDetail: { id: string; title?: string };
};

type DiscoverNavigation = NativeStackNavigationProp<DiscoverStackParamList, 'DiscoverList'>;

export default function AnimeListScreen() {
  const [data, setData] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<DiscoverNavigation>();

  const load = async () => {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('anime')
      .select('id,title,tags,episodes_count,thumbnail_url')
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) setError(error.message);
    setData(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading anime…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Failed to load anime</Text>
        <Text selectable style={{ textAlign: 'center', opacity: 0.8 }}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data || []}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('AnimeDetail', { id: item.id, title: item.title })}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              gap: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              backgroundColor: '#fff',
            },
            pressed ? { opacity: 0.7 } : null,
          ]}
        >
          {item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee' }}
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: '#eef2ff',
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
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.7 }}>No anime yet.</Text>
      }
    />
  );
}
