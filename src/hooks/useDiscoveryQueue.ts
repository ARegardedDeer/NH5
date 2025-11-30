import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/supabaseClient';

interface AnimeCard {
  id: string;
  title: string;
  thumbnail_url: string | null;
  synopsis: string | null;
  tags: string[] | null;
}

interface SwipeAction {
  animeId: string;
  action: 'skip' | 'rate' | 'add';
}

interface UseDiscoveryQueueResult {
  currentCard: AnimeCard | null;
  queue: AnimeCard[];
  currentIndex: number;
  queueLength: number;
  isLoading: boolean;
  error: Error | null;
  handleSwipe: (action: 'skip' | 'rate' | 'add') => Promise<void>;
  refetch: () => void;
}

export function useDiscoveryQueue(userId: string): UseDiscoveryQueueResult {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<AnimeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch smart queue (10 cards)
  const { data: fetchedQueue, isLoading, error, refetch } = useQuery<AnimeCard[]>({
    queryKey: ['discovery-queue', userId],
    enabled: !!userId,
    queryFn: async () => {
      console.log('[useDiscoveryQueue] Fetching smart queue for user:', userId);

      // 1. Get user's already-actioned anime (skip from last 30 days, rate, add)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: swipeActions } = await supabase
        .from('discovery_swipe_actions')
        .select('anime_id, action, created_at')
        .eq('user_id', userId);

      // Filter out recent skips (< 30 days), keep all rate/add forever
      const excludedAnimeIds = (swipeActions || [])
        .filter(action => {
          if (action.action === 'skip') {
            return new Date(action.created_at) > thirtyDaysAgo;
          }
          return true; // rate and add are excluded forever
        })
        .map(action => action.anime_id);

      console.log('[useDiscoveryQueue] Excluded anime count:', excludedAnimeIds.length);

      // 2. Get user's rated anime (exclude from queue)
      const { data: ratings } = await supabase
        .from('ratings')
        .select('anime_id')
        .eq('user_id', userId);

      const ratedAnimeIds = (ratings || []).map(r => r.anime_id);

      // 3. Get user's watchlist anime (exclude from queue)
      const { data: watchlist } = await supabase
        .from('user_lists')
        .select('anime_id')
        .eq('user_id', userId)
        .eq('list_type', 'watchlist');

      const watchlistAnimeIds = (watchlist || []).map(w => w.anime_id);

      // Combine all exclusions
      const allExcludedIds = [...new Set([
        ...excludedAnimeIds,
        ...ratedAnimeIds,
        ...watchlistAnimeIds,
      ])];

      console.log('[useDiscoveryQueue] Total excluded IDs:', allExcludedIds.length);

      // 4. Fetch 10 random anime NOT in exclusion list
      let query = supabase
        .from('anime')
        .select('id, title, thumbnail_url, synopsis, tags')
        .not('thumbnail_url', 'is', null); // Only anime with images

      // Apply exclusion filter if there are IDs to exclude
      if (allExcludedIds.length > 0) {
        query = query.not('id', 'in', `(${allExcludedIds.join(',')})`);
      }

      const { data, error: fetchError } = await query.limit(10);

      if (fetchError) {
        console.error('[useDiscoveryQueue] Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[useDiscoveryQueue] Fetched queue length:', data?.length);
      return (data as AnimeCard[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local queue when data is fetched
  useEffect(() => {
    if (fetchedQueue && fetchedQueue.length > 0) {
      setQueue(fetchedQueue);
      setCurrentIndex(0);
    }
  }, [fetchedQueue]);

  // Record swipe action mutation
  const recordSwipeMutation = useMutation({
    mutationFn: async ({ animeId, action }: SwipeAction) => {
      console.log('[useDiscoveryQueue] Recording swipe:', action, animeId);
      const { error } = await supabase
        .from('discovery_swipe_actions')
        .insert({
          user_id: userId,
          anime_id: animeId,
          action,
        });

      if (error) {
        console.error('[useDiscoveryQueue] Record error:', error);
        throw error;
      }
    },
    // Don't invalidate query on every swipe - let the queue advance naturally
    // Query will only refetch when queue is exhausted (see handleSwipe)
  });

  const handleSwipe = async (action: 'skip' | 'rate' | 'add') => {
    const currentCard = queue[currentIndex];
    if (!currentCard) {
      console.log('[useDiscoveryQueue] ❌ No current card at index:', currentIndex);
      return;
    }

    console.log('[useDiscoveryQueue] 🎯 Handling swipe:', {
      action,
      title: currentCard.title,
      currentIndex,
      queueLength: queue.length,
    });

    // Record the action
    await recordSwipeMutation.mutateAsync({
      animeId: currentCard.id,
      action,
    });

    // Navigate to next card (special handling for 'rate' action)
    if (action === 'rate') {
      // For rate action, advance to next card after rating is submitted
      const nextIndex = currentIndex + 1;
      console.log('[useDiscoveryQueue] ⭐ Rate action - advancing to index:', nextIndex);

      if (nextIndex < queue.length) {
        setCurrentIndex(nextIndex);
        console.log('[useDiscoveryQueue] ✅ Moved to next card');
      } else {
        console.log('[useDiscoveryQueue] 🔄 Queue exhausted after rate, refetching...');
        refetch();
      }
      return;
    }

    // For skip and add, move to next card
    const nextIndex = currentIndex + 1;
    console.log('[useDiscoveryQueue] ➡️ Advancing from index', currentIndex, 'to', nextIndex);

    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      console.log('[useDiscoveryQueue] ✅ Set currentIndex to:', nextIndex);
      console.log('[useDiscoveryQueue] 📋 Next card will be:', queue[nextIndex]?.title);
    } else {
      // Queue exhausted, refetch
      console.log('[useDiscoveryQueue] 🔄 Queue exhausted, refetching...');
      refetch();
    }
  };

  const currentCard = queue[currentIndex] || null;
  const queueLength = queue.length - currentIndex;

  return {
    currentCard,
    queue,
    currentIndex,
    queueLength,
    isLoading,
    error: error as Error | null,
    handleSwipe,
    refetch,
  };
}
