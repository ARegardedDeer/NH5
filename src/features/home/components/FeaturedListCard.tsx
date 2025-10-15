import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../../ui/theme';

type Props = { title:string; creator:string; avatar:string; images:string[] };
export function FeaturedListCard({ title, creator, avatar, images }: Props) {
  return (
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', gap:6, height:96 }}>
        {images.slice(0,3).map((src,i)=>(
          <Image key={i} source={{ uri: src }} style={s.tile}/>
        ))}
      </View>
      <Text style={s.title}>{title}</Text>
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop: 4 }}>
        <Image source={{ uri: avatar }} style={{ width:24, height:24, borderRadius:12 }} />
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>by {creator}</Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap:{ width: 288, borderRadius: 16, padding: 12, backgroundColor: 'rgba(91,19,236,0.2)', gap: 6 },
  tile:{ flex:1, borderRadius: 10, backgroundColor:'#222' },
  title:{ color: theme.colors.text, fontWeight:'800', fontSize: 14, marginTop: 6 }
});
