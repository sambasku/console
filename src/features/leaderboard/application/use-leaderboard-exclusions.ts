import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addLeaderboardExclusion,
  listLeaderboardExclusions,
  listLeaderboardSystemUsers,
  removeLeaderboardExclusion,
} from '../infrastructure/leaderboard-admin-api';

const key = ['admin', 'leaderboard', 'exclusions'] as const;
const systemKey = ['admin', 'leaderboard', 'system-users'] as const;

export function useLeaderboardExclusions(enabled: boolean) {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => listLeaderboardExclusions(signal),
    enabled,
  });
}

export function useLeaderboardSystemUsers(enabled: boolean) {
  return useQuery({
    queryKey: systemKey,
    queryFn: ({ signal }) => listLeaderboardSystemUsers(signal),
    enabled,
  });
}

export function useLeaderboardExclusionMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: key });
    await queryClient.invalidateQueries({ queryKey: systemKey });
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

export function useLeaderboardSystemExclusionMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: key });
    await queryClient.invalidateQueries({ queryKey: systemKey });
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