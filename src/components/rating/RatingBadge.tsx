import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

type Props = {
  value: number | null;          // 1.0–10.0 or 11 (for 11/10) or null
  loading?: boolean;             // spinner while parent resolves auth/load
  onPress: () => void;           // open the rating sheet
  label?: string;                // default "My Rating"
};

const fmt = (v: number | null) => (v === 11 ? '11/10' : (v != null ? v.toFixed(1) : '–'));

export default function RatingBadge({ value, loading, onPress, label = 'My Rating' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${fmt(value)}. Edit.`}
      hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
    >
      <Text style={styles.text}>
        {label}: <Text style={value === 11 ? styles.valueEleven : styles.value}>{fmt(value)}</Text> · Edit
      </Text>
      {loading ? <ActivityIndicator size="small" color="#A78BFA" /> : <View style={{ width: 16 }} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: { color: '#D7D6E7', fontSize: 14, fontWeight: '600' },
  value: { color: '#A78BFA', fontSize: 16, fontWeight: '700' },
  valueEleven: { color: '#FBB024', fontSize: 16, fontWeight: '800' },
});
