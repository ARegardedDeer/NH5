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

// __DEV__ auto sign-in (isolated to dev builds; no prod impact)
async function ensureDevSession() {
  if (!__DEV__) return;
  try {
    // dynamic import so this file stays optional and dev-only
    const { DEV_AUTH } = await import('../dev/devAuth');
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      console.log('[auth] ensureDevSession: session ok user=', sessionData.session.user.id);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEV_AUTH.email,
      password: DEV_AUTH.password,
    });
    if (error) {
      console.warn('[auth] ensureDevSession error', error.message);
      return;
    }
    console.log('[auth] ensureDevSession: signed in ok=', !!data.user, 'user=', data.user?.id ?? null);
  } catch (e: any) {
    console.warn('[auth] ensureDevSession fallback (devAuth missing or other error):', e?.message ?? String(e));
  }
}

// Kick off dev session in background so it doesn't block app boot
ensureDevSession();

export const whenAuthed: Promise<void> = (async () => {
  try {
    await ensureDevSession();
  } catch (e) {
    if (__DEV__) {
      const msg = (e as any)?.message ?? String(e);
      console.warn('[auth] ui gate error:', msg);
    }
  }
})();

export default supabase;
