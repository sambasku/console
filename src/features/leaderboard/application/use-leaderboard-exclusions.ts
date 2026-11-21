import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addLeaderboardExclusion,
  listLeaderboardExclusions,
  removeLeaderboardExclusion,
} from '../infrastructure/leaderboard-admin-api';

const key = ['admin', 'leaderboard', 'exclusions'] as const;

export function useLeaderboardExclusions(enabled: boolean) {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => listLeaderboardExclusions(signal),
    enabled,
  });
}

export function useLeaderboardExclusionMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: key });
  };

  const add = useMutation({
    mutationFn: (input: { user_id: string; note?: string | null }) => addLeaderboardExclusion(input),
    onSuccess: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeLeaderboardExclusion(userId),
    onSuccess: () => invalidate(),
  });

  return { add, remove };
}