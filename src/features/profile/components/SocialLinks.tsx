import React from 'react';
import { Text, View } from 'react-native';
import type { ProfileDetails, SocialLink } from '../hooks/useProfileData';

type SocialLinksProps = {
  profile: ProfileDetails | null;
  links: SocialLink[];
};

const ICON_MAP: Record<SocialLink['platform'], string> = {
  youtube: '▶',
  twitch: '🕹',
  twitter: '𝕏',
};

const LABEL_MAP: Record<SocialLink['platform'], string> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  twitter: 'X',
};

export function SocialLinks({ profile, links }: SocialLinksProps) {
  const shouldShow = Boolean(profile?.show_socials && links.length > 0);

  if (!shouldShow) {
    return null;
  }

  return (
    <View className="border border-white/10 bg-white/5 p-4 rounded-xl" testID="SocialLinksSection">
      <Text className="text-base font-semibold text-white mb-3">Socials</Text>
      <View className="flex-row flex-wrap gap-3">
        {links.map((link) => (
          <View
            key={`${link.platform}-${link.url}`}
            className="flex-row items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2"
          >
            <Text className="text-base text-white/80">{ICON_MAP[link.platform]}</Text>
            <View>
              <Text className="text-sm font-semibold text-white/90">{LABEL_MAP[link.platform]}</Text>
              <Text className="text-xs text-white/60" numberOfLines={1}>
                {link.url}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default SocialLinks;

