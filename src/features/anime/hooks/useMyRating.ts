import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyRating, upsertMyRating } from '../api/ratings';

export function useMyRating(anime_id: string) {
  const qc = useQueryClient();
  const queryKey = ['rating', anime_id];

  const ratingQuery = useQuery({
    queryKey,
    queryFn: () => getMyRating(anime_id),
  });

  const upsert = useMutation({
    mutationFn: (args: { score_overall: number; is_eleven_out_of_ten?: boolean }) =>
      upsertMyRating({ anime_id, ...args }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return { ratingQuery, upsert };
}
