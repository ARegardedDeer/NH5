import React from 'react';
import { View, Pressable, Linking, Text, StyleSheet } from 'react-native';

let Icon: any = null;
try {
  Icon = require('react-native-vector-icons/MaterialCommunityIcons').default;
} catch {}

type Props = {
  show?: boolean;
  socials?: { youtube?: string | null; twitch?: string | null; x?: string | null };
};

const providers: Array<{ key: keyof NonNullable<Props['socials']>; name: string; icon: string }> = [
  { key: 'youtube', name: 'YouTube', icon: 'youtube' },
  { key: 'twitch', name: 'Twitch', icon: 'twitch' },
  { key: 'x', name: 'X', icon: 'twitter' },
];

export default function SocialRow({ show = false, socials }: Props) {
  if (!show || !socials) return null;
  const items = providers
    .map(p => ({ ...p, url: socials?.[p.key] || null }))
    .filter(p => typeof p.url === 'string' && p.url!.length > 0);
  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      {items.map(p => (
        <Pressable
          key={p.key}
          onPress={() => Linking.openURL(p.url!)}
          accessibilityRole="button"
          accessibilityLabel={p.name}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
          {Icon ? (
            <Icon name={p.icon} size={20} color="#C9C4FF" />
          ) : (
            <Text style={styles.fallback}>{p.name}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,196,255,0.12)',
  },
  btnPressed: { opacity: 0.7 },
  fallback: { color: '#C9C4FF', fontSize: 12 },
});
