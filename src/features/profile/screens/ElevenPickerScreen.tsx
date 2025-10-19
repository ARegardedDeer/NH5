import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Alert } from 'react-native';
import { supabase } from '../../../db/supabaseClient';
import useProfileData from '../hooks/useProfileData';
import PosterImage from '../../../ui/components/PosterImage';

type Item = { id: string; title: string; thumbnail_url?: string | null };

export default function ElevenPickerScreen() {
  const { user, refetch } = useProfileData();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(t: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('anime')
      .select('id,title,thumbnail_url')
      .ilike('title', `%${t}%`)
      .limit(30);
    setLoading(false);
    if (error) Alert.alert('Search failed', error.message);
    else setItems((data ?? []) as Item[]);
  }

  useEffect(() => {
    if (q.trim().length >= 2) search(q.trim());
    else setItems([]);
  }, [q]);

  async function setEleven(animeId: string) {
    if (!user?.id) return;
    const unset = supabase
      .from('ratings')
      .update({ is_eleven_out_of_ten: false })
      .eq('user_id', user.id)
      .eq('is_eleven_out_of_ten', true);
    const set = supabase
      .from('ratings')
      .upsert(
        {
          user_id: user.id,
          anime_id: animeId,
          score_overall: 10,
          is_eleven_out_of_ten: true,
        },
        { onConflict: 'user_id,anime_id' },
      );
    const [{ error: e1 }, { error: e2 }] = await Promise.all([unset, set]);
    if (e1 || e2) Alert.alert('Failed to set 11/10', (e1 || e2)!.message);
    else {
      await refetch?.();
      Alert.alert('11/10 set!', 'Updated your all-time #1.');
    }
  }

  return (
    <View className="flex-1 bg-[#161022] px-4 py-6">
      <Text className="text-white text-2xl font-bold mb-3">Pick your 11/10</Text>
      <TextInput
        placeholder="Search anime…"
        placeholderTextColor="#AAA"
        value={q}
        onChangeText={setQ}
        className="rounded-xl bg-zinc-900/80 text-white px-3 py-3 mb-3"
      />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setEleven(item.id)} className="flex-row items-center gap-3 p-2 rounded-xl bg-white/5 mb-2">
            <PosterImage uri={item.thumbnail_url || null} width={50} />
            <Text className="text-white text-base">{item.title}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-white/60 mt-4">{loading ? 'Searching…' : 'Type 2+ chars to search.'}</Text>
        }
      />
    </View>
  );
}
