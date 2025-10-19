import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (__DEV__) console.warn('Missing SUPABASE env vars; check .env and Babel dotenv plugin');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

try {
  const host = SUPABASE_URL?.replace(/^https?:\/\//, '').split('/')[0];
  if (host) {
    console.log('[NH5] Connected to Supabase host:', host);
  } else {
    console.log('[NH5] Supabase URL host not detected');
  }
} catch (err) {
  console.log('[NH5] Failed to parse Supabase URL');
}

export default supabase;
