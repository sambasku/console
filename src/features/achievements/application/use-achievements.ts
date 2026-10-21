import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAchievementRequest,
  deleteAchievementRequest,
  grantAchievementRequest,
  listAchievementsRequest,
  listRecipientsRequest,
  previewAchievementRequest,
  revokeAwardRequest,
  scanAchievementRequest,
  updateAchievementRequest,
  type AchievementListResult,
} from '../infrastructure/achievement-api';
import type { AchievementInput, RewardType } from '../domain/achievement';

export function useAchievementList(rewardType?: RewardType) {
  return useQuery<AchievementListResult>({
    queryKey: ['achievements', rewardType ?? 'all'],
    queryFn: ({ signal }) => listAchievementsRequest({ reward_type: rewardType, limit: 50 }, signal),
  });
}

export function useCreateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AchievementInput) => createAchievementRequest(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

export function useUpdateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<AchievementInput>) =>
      updateAchievementRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

export function useDeleteAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAchievementRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

export function useScanAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scanAchievementRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

export function useGrantAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, usernames }: { id: string; usernames: string[] }) =>
      grantAchievementRequest(id, usernames),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

export function usePreviewAchievement(enabled: boolean, achievementId: string | null) {
  return useQuery({
    queryKey: ['achievements', 'preview', achievementId],
    queryFn: () => previewAchievementRequest(achievementId!),
    enabled: enabled && !!achievementId,
  });
}

export function useRevokeAward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ achievementId, awardId }: { achievementId: string; awardId: string }) =>
      revokeAwardRequest(achievementId, awardId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

export function useRecipients(enabled: boolean, achievementId: string | null) {
  return useQuery({
    queryKey: ['achievements', 'recipients', achievementId],
    queryFn: ({ signal }) => listRecipientsRequest(achievementId!, signal),
    enabled: enabled && !!achievementId,
  });
}

