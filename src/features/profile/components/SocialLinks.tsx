import React from 'react';
import { Text, View } from 'react-native';
import type { ProfileUser, SocialLink } from '../hooks/useProfileData';

type SocialLinksProps = {
  user?: ProfileUser;
  links: SocialLink[];
};

const LABEL_MAP: Record<SocialLink['platform'], string> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  twitter: 'X',
};

export function SocialLinks({ user, links }: SocialLinksProps) {
  const shouldShow = Boolean(user?.show_socials && links.length > 0);

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
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2"
          >
            <Text className="text-xs font-semibold text-white">
              {LABEL_MAP[link.platform]}
            </Text>
            <Text className="text-[11px] text-white/70 mt-1" numberOfLines={1}>
              {link.url}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default SocialLinks;
