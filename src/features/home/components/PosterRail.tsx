import React from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { theme } from '../../../ui/theme';

type Poster = { id:string; title:string; img:string };
export function PosterRail({ posters }: { posters: Poster[] }) {
  return (
    <FlatList
      horizontal
      data={posters}
      keyExtractor={(i)=>i.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12 }}
      renderItem={({ item }) => (
        <View style={{ width: 128 }}>
          <Image source={{ uri: item.img }} style={s.poster} />
          <Text numberOfLines={1} style={s.caption}>{item.title}</Text>
        </View>
      )}
    />
  );
}
const s = StyleSheet.create({
  poster:{ width: '100%', aspectRatio: 3/4, borderRadius: 10, backgroundColor:'#222' },
  caption:{ color: theme.colors.text, fontSize: 12, marginTop: 6, fontWeight:'600' }
});
