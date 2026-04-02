import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PosterRail } from './PosterRail';
import { theme } from '../../../ui/theme';

type Props = {
  title: string;
  subtitle: string;
  tags: string[];
  posters: {id:string; title:string; img:string}[];
};
export function CollectionCard({ title, subtitle, tags, posters }: Props) {
  return (
    <View style={s.card}>
      <Text style={s.h3}>{title}</Text>
      <Text style={s.sub}>{subtitle}</Text>
      <View style={{ marginTop: 8 }}>
        <PosterRail posters={posters} />
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop: 10 }}>
        {tags.map(t=>(
          <View key={t} style={s.chip}><Text style={s.chipText}>{t}</Text></View>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card:{
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  h3:{ color: theme.colors.text, fontSize: 18, fontWeight:'700' },
  sub:{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  chip:{ backgroundColor: theme.colors.chip, paddingHorizontal:10, paddingVertical:6, borderRadius: 999 },
  chipText:{ color: theme.colors.text, fontSize: 11, fontWeight:'600' }
});
