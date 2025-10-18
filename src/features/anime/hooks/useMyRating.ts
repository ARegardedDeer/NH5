import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyRating, upsertMyRating } from '../api/ratings';

type UpsertArgs = { score_overall: number | null; is_eleven_out_of_ten?: boolean };

export function useMyRating(anime_id: string) {
  const qc = useQueryClient();
  const queryKey = ['rating', anime_id];

  const ratingQuery = useQuery({
    queryKey,
    queryFn: () => getMyRating(anime_id),
  });

  const upsertMutation = useMutation({
    mutationFn: (args: UpsertArgs) => upsertMyRating({ anime_id, ...args }),
    onSuccess: result => {
      if (!result?.error) {
        qc.invalidateQueries({ queryKey });
      }
    },
  });

  const upsert = async (args: UpsertArgs) => upsertMutation.mutateAsync(args);

  return { ratingQuery, upsert, upsertStatus: upsertMutation };
}
