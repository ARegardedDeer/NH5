import { supabase } from '../db/supabaseClient';

type Check = { table: string; columns: string[] };
// Minimal set used by the Profile screen today. Extend as needed.
const CHECKS: Check[] = [
  { table: 'badges', columns: ['id','slug','name'] },
  { table: 'user_badges', columns: ['user_id','badge_id','unlocked_at','is_showcased'] },
  { table: 'user_profiles', columns: ['user_id','handle','show_socials','show_level'] },
  { table: 'user_toplist', columns: ['user_id','anime_id','position'] },
  { table: 'ratings', columns: ['id','user_id','anime_id','is_eleven_out_of_ten'] },
  { table: 'anime', columns: ['id','title','thumbnail_url'] },
];

async function checkCol(table: string, col: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).select(col).limit(0);
    if (error) {
      const msg = (error as any)?.message || String(error);
      // PostgREST typically returns "column <x> does not exist"
      const isMissing =
        /does not exist|column|unknown column/i.test(msg);
      console.log(
        `%c[schema] ${isMissing ? 'MISSING' : 'WARN'} ${table}.${col}: ${msg}`,
        `color:${isMissing ? '#ff6b6b' : '#ffb86c'}`
      );
      return false;
    }
    return true;
  } catch (e) {
    console.log('[schema] check failed', table, col, e);
    return false;
  }
}

export async function runSchemaGuard() {
  if (!__DEV__) return;
  // Be defensive if client not ready in early app init
  if (!supabase || typeof (supabase as any).from !== 'function') {
    console.log('[schema] skip: supabase client unavailable');
    return;
  }
  console.log('%c[schema] guard start', 'color:#8be9fd');
  let missing = 0;
  for (const { table, columns } of CHECKS) {
    for (const col of columns) {
      const ok = await checkCol(table, col);
      if (!ok) missing++;
    }
  }
  if (missing === 0) {
    console.log('%c[schema] OK — no missing columns detected', 'color:#00d084');
  } else {
    console.log(`%c[schema] FAIL — ${missing} missing column(s). See logs above.`, 'color:#ff6b6b');
  }
}
