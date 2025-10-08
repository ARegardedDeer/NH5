import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../db/supabaseClient';

export type AnimeRow = {
  id: string;
  title: string;
  tags: string[] | null;
  episodes_count: number | null;
  air_date: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
};

export function useAnimeList() {
  return useQuery({
    queryKey: ['anime', 'list'],
    queryFn: async (): Promise<AnimeRow[]> => {
      const { data, error } = await supabase
        .from('anime')
        .select('id,title,tags,episodes_count,air_date,thumbnail_url,created_at')
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });
}
