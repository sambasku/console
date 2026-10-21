import { client } from '@/shared/api/client';
import type {
  Achievement,
  AchievementCategory,
  AchievementCriteria,
  AchievementInput,
  AchievementRecipient,
  GrantResult,
  PreviewResult,
  RewardType,
  ScanResult,
} from '../domain/achievement';

interface AchievementWire {
  id: string;
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  reward_type: RewardType;
  badge_url: string | null;
  criteria: AchievementCriteria;
  family: string | null;
  level: number | null;
  is_active: boolean;
  created_at: number;
  updated_at: number | null;
  recipient_count?: number;
}

function mapAchievement(w: AchievementWire): Achievement {
  return {
    id: w.id,
    code: w.code,
    title: w.title,
    description: w.description,
    category: w.category,
    rewardType: w.reward_type,
    badgeUrl: w.badge_url,
    criteria: w.criteria,
    family: w.family ?? null,
    level: w.level ?? null,
    isActive: w.is_active,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    recipientCount: w.recipient_count,
  };
}

export interface AchievementListResult {
  items: Achievement[];
  nextCursor: string | null;
}

export async function listAchievementsRequest(
  params: { reward_type?: RewardType; limit?: number; before?: string } = {},
  signal?: AbortSignal,
): Promise<AchievementListResult> {
  const res = await client.get<{
    success: true;
    data: { items: AchievementWire[]; next_cursor: string | null };
  }>('/admin/achievements', {
    params: { limit: params.limit ?? 50, reward_type: params.reward_type, before: params.before },
    signal,
  });
  return {
    items: res.data.data.items.map(mapAchievement),
    nextCursor: res.data.data.next_cursor,
  };
}

export async function createAchievementRequest(body: AchievementInput): Promise<Achievement> {
  const res = await client.post<{ success: true; data: AchievementWire }>(
    '/admin/achievements',
    body,
  );
  return mapAchievement(res.data.data);
}

export async function updateAchievementRequest(
  id: string,
  body: Partial<Omit<AchievementInput, 'code'>>,
): Promise<Achievement> {
  const res = await client.put<{ success: true; data: AchievementWire }>(
    `/admin/achievements/${id}`,
    body,
  );
  return mapAchievement(res.data.data);
}

export async function deleteAchievementRequest(id: string): Promise<void> {
  await client.delete(`/admin/achievements/${id}`);
}

export async function scanAchievementRequest(id: string): Promise<ScanResult> {
  const res = await client.post<{ success: true; data: ScanResult }>(
    `/admin/achievements/${id}/scan`,
    {},
  );
  return res.data.data;
}

export async function grantAchievementRequest(
  id: string,
  usernames: string[],
): Promise<GrantResult> {
  const res = await client.post<{ success: true; data: GrantResult }>(
    `/admin/achievements/${id}/grant`,
    { usernames },
  );
  return res.data.data;
}

export async function previewAchievementRequest(id: string): Promise<PreviewResult> {
  const res = await client.get<{ success: true; data: PreviewResult }>(
    `/admin/achievements/${id}/preview`,
  );
  return res.data.data;
}

export async function revokeAwardRequest(
  achievementId: string,
  awardId: string,
): Promise<void> {
  await client.delete(`/admin/achievements/${achievementId}/awards/${awardId}`);
}

export async function listRecipientsRequest(
  achievementId: string,
  signal?: AbortSignal,
): Promise<AchievementRecipient[]> {
  const res = await client.get<{
    success: true;
    data: {
      items: Array<{
        award_id: string;
        username: string;
        display_name: string;
        awarded_at: number;
        granted_via: string;
      }>;
      next_cursor: string | null;
    };
  }>(`/admin/achievements/${achievementId}/recipients`, {
    params: { limit: 100 },
    signal,
  });
  return res.data.data.items.map((w) => ({
    awardId: w.award_id,
    username: w.username,
    displayName: w.display_name,
    awardedAt: w.awarded_at,
    grantedVia: w.granted_via,
  }));
}

