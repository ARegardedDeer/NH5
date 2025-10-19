import React from 'react';
import { Image, Text, View } from 'react-native';
import type { ProfileDetails, ProfileUser } from '../hooks/useProfileData';

type ProfileHeaderProps = {
  user: ProfileUser | null;
  profile: ProfileDetails | null;
};

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'NH';
  const displayName = user?.username ?? 'Explorer';
  const showLevel = Boolean(profile?.show_level && typeof user?.level === 'number');

  return (
    <View className="border border-white/10 bg-white/5 p-4 rounded-xl" testID="ProfileHeader">
      <View className="flex-row items-center">
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            className="h-20 w-20 rounded-full border border-white/10 bg-black/40"
          />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/40">
            <Text className="text-xl font-semibold text-white/80">{initials}</Text>
          </View>
        )}
        <View className="ml-4 flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">{displayName}</Text>
            {showLevel ? (
              <View className="rounded-full bg-white/10 px-3 py-1">
                <Text className="text-xs font-medium text-white/80">{`Lvl ${user?.level ?? 0}`}</Text>
              </View>
            ) : null}
          </View>
          {user?.username ? (
            <Text className="mt-1 text-sm text-white/50">@{user.username}</Text>
          ) : null}
        </View>
      </View>
      {profile?.bio ? (
        <Text className="mt-3 text-sm leading-5 text-white/80">{profile.bio}</Text>
      ) : null}
    </View>
  );
}

export default ProfileHeader;

