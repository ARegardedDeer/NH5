import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nh5_device_user_id';

let randomUUID: (() => string) | undefined;

if (typeof globalThis?.crypto?.randomUUID === 'function') {
  randomUUID = () => globalThis.crypto.randomUUID();
} else {
  try {
    randomUUID = require('expo-crypto').randomUUID;
  } catch {
    randomUUID = undefined;
  }
}

// RFC4122 v4-ish shim if crypto module is unavailable
function uuidShim() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateDeviceUserId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;
  let id: string;
  const generator = typeof randomUUID === 'function' ? randomUUID : uuidShim;
  id = generator();
  await AsyncStorage.setItem(KEY, id);
  return id;
}
