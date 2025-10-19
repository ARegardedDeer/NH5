import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId } from '../state/currentUser';

const STORAGE_KEY = 'nh5_demo_user';

export async function ensureDemoUserCached(): Promise<string> {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) {
    console.log(`[NH5] Demo user already cached: ${existing}`);
    return existing;
  }

  const id = await getCurrentUserId();
  console.log(`[NH5] Demo user cached: ${id}`);
  return id;
}

