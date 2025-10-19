import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Avatar from '../../../ui/components/Avatar';

type ProfileHeaderProps = {
  displayName: string;
  level?: number | null;
  handle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  canEdit?: boolean;
  onPressEdit?: () => void;
};

export function ProfileHeader({
  displayName,
  level,
  handle,
  bio,
  avatarUrl,
  canEdit,
  onPressEdit,
}: ProfileHeaderProps) {
  const showLevel = typeof level === 'number' && Number.isFinite(level);

  return (
    <View className="px-4 pt-6 pb-3 flex-row items-center justify-between" testID="ProfileHeader">
      <View className="flex-row items-center gap-4">
        <Avatar name={displayName} uri={avatarUrl || null} size={84} />
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">{displayName}</Text>
          {!!handle && <Text className="text-white/70">@{handle}</Text>}
          {showLevel ? <Text className="text-white/60 mt-1">Level {level}</Text> : null}
          {!!bio && <Text className="text-white/80 mt-1">{bio}</Text>}
        </View>
      </View>
      {canEdit ? (
        <Pressable onPress={onPressEdit} className="rounded-full bg-purple-600 px-4 py-2">
          <Text className="text-white font-semibold">Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default ProfileHeader;
