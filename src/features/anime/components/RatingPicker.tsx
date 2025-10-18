import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../ui/theme';

type Props = {
  value?: number | null;
  onChange: (n: number) => void;
  eleven?: boolean;
  onToggleEleven: () => void;
};

export function RatingPicker({ value, onChange, eleven, onToggleEleven }: Props) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>Your Rating</Text>
      <View style={s.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <Pressable key={n} onPress={() => onChange(n)} style={[s.chip, value === n && s.chipActive]}>
            <Text style={[s.chipText, value === n && s.chipTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onToggleEleven} style={[s.eleven, eleven && s.chipActive]}>
        <Text style={[s.chipText, eleven && s.chipTextActive]}>Make it an 11/10 🔥</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: 'transparent' },
  chipText: { color: theme.colors.text },
  chipTextActive: { color: '#000', fontWeight: '800' },
  eleven: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
