import { useMyListByStatus } from './useMyListByStatus';

interface UseActiveAnimeOptions {
  userId: string | undefined;
  enabled?: boolean;
}

export const useActiveAnime = ({ userId, enabled = true }: UseActiveAnimeOptions) => {
  return useMyListByStatus({
    userId,
    statuses: ['Watching', 'Rewatching'],
    order: [
      { column: 'last_watched_at', ascending: false, nullsFirst: false },
      { column: 'updated_at', ascending: false, nullsFirst: false },
    ],
    enabled,
  });
};
