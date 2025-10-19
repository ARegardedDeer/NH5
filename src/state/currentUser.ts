import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '../db/supabaseClient';

const STORAGE_KEY = 'nh5_demo_user';

export async function getCurrentUserId(): Promise<string> {
  const cached = await AsyncStorage.getItem(STORAGE_KEY);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'jj')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error('Demo user @jj not found. Run the seed SQL.');
  }

  await AsyncStorage.setItem(STORAGE_KEY, data.id);
  return data.id;
}

