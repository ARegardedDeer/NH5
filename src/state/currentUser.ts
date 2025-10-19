import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../db/supabaseClient";

const DEMO_EMAIL = "demo@nh5.local";
const KEY = "nh5_demo_user";

/**
 * Returns a user id to use for read-only profile:
 * 1) tries AsyncStorage key nh5_demo_user
 * 2) otherwise looks up Supabase user by DEMO_EMAIL and caches it
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cached = await AsyncStorage.getItem(KEY);
    if (cached) {
      __DEV__ && console.log("[NH5] Using cached user id", cached);
      return cached;
    }
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", DEMO_EMAIL)
      .limit(1)
      .maybeSingle();

    if (error) {
      __DEV__ && console.log("[NH5] Supabase users lookup error:", error.message);
      return null;
    }
    if (data?.id) {
      await AsyncStorage.setItem(KEY, data.id);
      __DEV__ && console.log("[NH5] Cached demo user id", data.id);
      return data.id;
    }
    return null;
  } catch (e: any) {
    __DEV__ && console.log("[NH5] getCurrentUserId error:", e?.message || e);
    return null;
  }
}

/** for testing: clear the cached id */
export async function clearCurrentUserCache() {
  await AsyncStorage.removeItem(KEY);
}
