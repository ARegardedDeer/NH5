import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(2);
}

const sb = createClient(url, key);

const [{ data: anime, error: aErr }] = await Promise.all([
  sb.from('anime').select('id,title').order('created_at', { ascending: false }).limit(1).maybeSingle(),
]);

if (aErr || !anime) {
  console.error('Anime fetch failed:', aErr);
  process.exit(3);
}

const payload = {
  device_user_id: '00000000-0000-4000-8000-000000000000',
  anime_id: anime.id,
  score_overall: 8,
  is_eleven_out_of_ten: false,
};

const { data, error, status } = await sb
  .from('ratings')
  .upsert(payload, { onConflict: 'device_user_id,anime_id', ignoreDuplicates: false })
  .select()
  .maybeSingle();

console.log('Probe status:', status);
if (error) {
  console.error('Probe error:', JSON.stringify(error, null, 2));
  process.exit(4);
}

console.log('Probe row:', data);
process.exit(0);
