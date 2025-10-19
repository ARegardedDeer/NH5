import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

type Props = {
  socials?: { youtube?: string | null; twitch?: string | null; x?: string | null };
  show?: boolean;
};

function normalizeUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

const Pill = ({ label, url }: { label: string; url: string }) => {
  const handlePress = () => {
    try {
      Linking.openURL(normalizeUrl(url));
    } catch (err) {
      console.warn('Failed to open social link', err);
    }
  };

  return (
    <Pressable onPress={handlePress} className="mr-2 mb-2 rounded-full bg-white/10 px-3 py-2">
      <Text className="text-xs font-medium text-white">{label}</Text>
    </Pressable>
  );
};

export function SocialLinks({ socials, show }: Props) {
  if (!show) {
    return null;
  }

  const entries: Array<{ label: string; url: string }> = [];
  if (socials?.youtube) {
    entries.push({ label: 'YouTube', url: socials.youtube });
  }
  if (socials?.twitch) {
    entries.push({ label: 'Twitch', url: socials.twitch });
  }
  if (socials?.x) {
    entries.push({ label: 'X', url: socials.x });
  }

  if (!entries.length) {
    return <Text className="text-white/60">No socials added yet.</Text>;
  }

  return (
    <View className="flex-row flex-wrap">
      {entries.map((entry) => (
        <Pill key={entry.label} label={entry.label} url={entry.url} />
      ))}
    </View>
  );
}

export default SocialLinks;
