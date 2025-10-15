import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { PosterRail } from './PosterRail';
import { theme } from '../../../ui/theme';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  title: string;
  subtitle: string;
  tags: string[];
  posters: {id:string; title:string; img:string}[];
  colors: [string, string];
  index?: number;
  scrollY?: Animated.Value;
};
export function CollectionCard({ title, subtitle, tags, posters, colors, index = 0, scrollY }: Props) {
  const { height } = Dimensions.get('window');
  const inputRange = useMemo(() => [0, height * 2], [height]);
  const translateY = scrollY
    ? scrollY.interpolate({
        inputRange,
        outputRange: [0, 12],
        extrapolate: 'clamp',
      })
    : 0;

  return (
    <View style={s.cardOuter}>
      <Animated.View style={[s.gradientWrap, typeof translateY === 'number' ? null : { transform: [{ translateY }] }]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.gradient} />
      </Animated.View>
      <View style={s.cardInner}>
        <Text style={s.h3}>{title}</Text>
        <Text style={s.sub}>{subtitle}</Text>
        <View style={{ marginTop: 8 }}>
          <PosterRail posters={posters} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {tags.map((t) => (
            <View key={t} style={s.chip}>
              <Text style={s.chipText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  cardOuter: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    opacity: 0.35,
  },
  cardInner: {
    padding: 14,
  },
  h3:{ color: theme.colors.text, fontSize: 18, fontWeight:'800' },
  sub:{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  chip:{ backgroundColor: theme.colors.chip, paddingHorizontal:10, paddingVertical:6, borderRadius: 999 },
  chipText:{ color: theme.colors.text, fontSize: 11, fontWeight:'600' }
});
