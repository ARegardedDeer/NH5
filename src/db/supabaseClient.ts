import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

try {
  const host = new URL(SUPABASE_URL).host;
  console.log('[NH5] Connected to Supabase host:', host);
} catch (err) {
  console.log('[NH5] Failed to parse Supabase URL');
}

export default supabase;
