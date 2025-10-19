import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../db/supabaseClient';
import useProfileData from '../hooks/useProfileData';

export default function EditProfileScreen() {
  const nav = useNavigation<any>();
  const { user, handle, bio: initialBio, showSocials, socials, refetch } = useProfileData();
  const [profileHandle, setProfileHandle] = useState(handle ?? user?.username ?? '');
  const [bio, setBio] = useState(initialBio ?? '');
  const [shouldShowSocials, setShouldShowSocials] = useState(Boolean(showSocials));
  const [yt, setYt] = useState(socials?.youtube ?? '');
  const [tw, setTw] = useState(socials?.twitch ?? '');
  const [xx, setXx] = useState(socials?.x ?? '');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          handle: profileHandle || null,
          bio: bio || null,
          show_socials: shouldShowSocials,
          youtube: yt || null,
          twitch: tw || null,
          x: xx || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    setSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
    } else {
      await refetch?.();
      nav.goBack();
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#161022] px-4 py-6">
      <Text className="text-white text-2xl font-bold mb-4">Edit Profile</Text>

      <Text className="text-white/80 mb-1">Handle</Text>
      <TextInput
        value={profileHandle}
        onChangeText={setProfileHandle}
        className="rounded-xl bg-zinc-900/80 text-white px-3 py-3"
      />

      <Text className="text-white/80 mt-4 mb-1">Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        className="rounded-xl bg-zinc-900/80 text-white px-3 py-3"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View className="flex-row items-center justify-between mt-6">
        <Text className="text-white font-semibold">Show Socials</Text>
        <Pressable
          onPress={() => setShouldShowSocials((s) => !s)}
          className={`px-3 py-2 rounded-full ${shouldShowSocials ? 'bg-purple-600' : 'bg-white/10'}`}
        >
          <Text className="text-white">{shouldShowSocials ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>

      <Text className="text-white/80 mt-4 mb-1">YouTube</Text>
      <TextInput value={yt} onChangeText={setYt} className="rounded-xl bg-zinc-900/80 text-white px-3 py-3" />

      <Text className="text-white/80 mt-4 mb-1">Twitch</Text>
      <TextInput value={tw} onChangeText={setTw} className="rounded-xl bg-zinc-900/80 text-white px-3 py-3" />

      <Text className="text-white/80 mt-4 mb-1">X (Twitter)</Text>
      <TextInput value={xx} onChangeText={setXx} className="rounded-xl bg-zinc-900/80 text-white px-3 py-3" />

      <Pressable onPress={onSave} disabled={saving} className="mt-8 rounded-xl bg-purple-600 px-4 py-3 items-center">
        <Text className="text-white font-semibold">{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>

      <View className="h-8" />
    </ScrollView>
  );
}
