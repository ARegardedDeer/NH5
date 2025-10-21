import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ProfileAvatar from './ProfileAvatar';
import SocialRow from './SocialRow';

type ProfileHeaderProps = {
  displayName?: string | null;
  handle?: string | null;
  level?: number | null;
  bio?: string | null;
  canEdit?: boolean;
  onPressEdit?: () => void;
  showSocials?: boolean;
  socials?: { youtube?: string | null; twitch?: string | null; x?: string | null };
};

export default function ProfileHeader({
  displayName,
  handle,
  level,
  bio,
  canEdit,
  onPressEdit,
  showSocials,
  socials,
}: ProfileHeaderProps) {
  const name = displayName || 'Anonymous Otaku';
  const handleText = handle ? `@${handle}` : null;
  const levelText = Number.isFinite(level) ? `Lv ${level}` : null;

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        if (__DEV__) {
          const { height } = event.nativeEvent.layout;
          console.log('[profile] header onLayout height=', height);
        }
      }}
    >
      <ProfileAvatar size={96} />
      <View style={styles.textBlock}>
        <Text style={styles.displayName} numberOfLines={1}>
          {name}
        </Text>
        {handleText ? (
          <Text style={styles.handle} numberOfLines={1}>
            {handleText}
          </Text>
        ) : null}
        {levelText ? <Text style={styles.level}>{levelText}</Text> : null}
        {bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {bio}
          </Text>
        ) : null}
        <SocialRow show={showSocials} socials={socials} />
      </View>
      {canEdit ? (
        <Pressable style={styles.editButton} onPress={onPressEdit}>
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 112,
    zIndex: 10,
    gap: 6,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  handle: {
    color: '#C8C6D8',
    fontSize: 14,
    fontWeight: '500',
  },
  level: {
    color: '#C8C6D8',
    fontSize: 13,
    fontWeight: '600',
  },
  bio: {
    color: '#C8C6D8',
    fontSize: 14,
    lineHeight: 20,
  },
  editButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
