import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../db/supabaseClient';

export function useAnimeById(id: string) {
  return useQuery({
    queryKey: ['anime', 'byId', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anime')
        .select('id,title,tags,episodes_count,air_date,thumbnail_url,synopsis,created_at,voice_actors')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
