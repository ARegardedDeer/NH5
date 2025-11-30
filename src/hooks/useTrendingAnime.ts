import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

interface AnimeCard {
  id: string;
  title: string;
  thumbnail_url: string | null;
  synopsis: string | null;
  tags: string[] | null;
  episodes_count: number | null;
  air_date: string | null;
  created_at: string;
}

export const useTrendingAnime = () => {
  return useQuery({
    queryKey: ['trending-anime'],
    queryFn: async () => {
      console.log('[trending] Fetching trending anime...');

      // Get anime with most recent ratings (trending = frequently rated recently)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: recentRatings, error: ratingsError } = await supabase
        .from('ratings')
        .select('anime_id')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('[trending] Error fetching recent ratings:', ratingsError);
        throw ratingsError;
      }

      // Count frequency of each anime_id
      const animeCounts = (recentRatings || []).reduce((acc, { anime_id }) => {
        acc[anime_id] = (acc[anime_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top 10 most frequently rated anime IDs
      const trendingIds = Object.entries(animeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      if (trendingIds.length === 0) {
        console.log('[trending] No trending anime found, using random fallback');

        // Fallback: Get random anime if no recent activity
        const { data: fallbackAnime, error: fallbackError } = await supabase
          .from('anime')
          .select('id, title, thumbnail_url, synopsis, tags, episodes_count, air_date, created_at')
          .not('thumbnail_url', 'is', null)
          .limit(10);

        if (fallbackError) throw fallbackError;

        console.log('[trending] Fetched fallback anime:', fallbackAnime?.length);
        return (fallbackAnime || []) as AnimeCard[];
      }

      // Fetch the actual anime data
      const { data: trendingAnime, error: animeError } = await supabase
        .from('anime')
        .select('id, title, thumbnail_url, synopsis, tags, episodes_count, air_date, created_at')
        .in('id', trendingIds);

      if (animeError) {
        console.error('[trending] Error fetching anime:', animeError);
        throw animeError;
      }

      // Sort by frequency (preserve trending order)
      const sorted = (trendingAnime || []).sort((a, b) => {
        return trendingIds.indexOf(a.id) - trendingIds.indexOf(b.id);
      });

      console.log('[trending] Fetched trending anime:', sorted.length);
      return sorted as AnimeCard[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};
