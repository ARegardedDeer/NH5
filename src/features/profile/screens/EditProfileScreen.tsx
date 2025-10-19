import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../db/supabaseClient';
import useProfileData from '../hooks/useProfileData';

export default function EditProfileScreen() {
  const nav = useNavigation<any>();
  const { user, profile, refetch } = useProfileData();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [showSocials, setShowSocials] = useState(!!profile?.show_socials);
  const [yt, setYt] = useState(profile?.social_youtube ?? '');
  const [tw, setTw] = useState(profile?.social_twitch ?? '');
  const [xx, setXx] = useState(profile?.social_x ?? '');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          display_name: displayName || null,
          bio: bio || null,
          show_socials: showSocials,
          social_youtube: yt || null,
          social_twitch: tw || null,
          social_x: xx || null,
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

      <Text className="text-white/80 mb-1">Display Name</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
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
          onPress={() => setShowSocials((s) => !s)}
          className={`px-3 py-2 rounded-full ${showSocials ? 'bg-purple-600' : 'bg-white/10'}`}
        >
          <Text className="text-white">{showSocials ? 'On' : 'Off'}</Text>
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
