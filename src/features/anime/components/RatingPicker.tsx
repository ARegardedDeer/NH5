import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../ui/theme';

type Props = {
  score: number | null;
  eleven: boolean;
  onPickScore: (n: number) => void;
  onToggleEleven: () => void;
  onSave: () => void;
  saving?: boolean;
};

export const RatingPicker: React.FC<Props> = ({
  score,
  eleven,
  onPickScore,
  onToggleEleven,
  onSave,
  saving,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length: 10 }).map((_, i) => {
          const n = i + 1;
          const active = score === n && !eleven;
          return (
            <Pressable
              key={n}
              onPress={() => onPickScore(n)}
              style={[styles.dot, active && styles.dotActive, eleven && styles.dotDisabled]}
              disabled={eleven}
            >
              <Text style={[styles.dotText, active && styles.dotTextActive]}>{n}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onToggleEleven}
          style={[styles.eleven, eleven && styles.elevenActive]}
        >
          <Text style={[styles.elevenText, eleven && styles.elevenTextActive]}>11</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onSave}
        disabled={saving || (!eleven && (score == null))}
        style={({ pressed }) => [
          styles.save,
          (saving || (!eleven && (score == null))) && styles.saveDisabled,
          pressed && !saving && styles.savePressed,
        ]}
      >
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Rating'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  dot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dotDisabled: { opacity: 0.35 },
  dotText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  dotTextActive: { color: '#000' },
  eleven: {
    marginLeft: 8,
    paddingHorizontal: 14, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  elevenActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  elevenText: { color: 'rgba(255,255,255,0.9)', fontWeight: '800' },
  elevenTextActive: { color: '#000' },
  save: {
    marginTop: 8,
    height: 44, borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  savePressed: { opacity: 0.85 },
  saveText: { color: '#000', fontWeight: '700' },
});
