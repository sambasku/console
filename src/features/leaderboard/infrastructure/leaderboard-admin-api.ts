import { client } from '@/shared/api/client';

export interface LeaderboardExclusionWire {
  user_id: string;
  username: string;
  display_name: string | null;
  note: string | null;
  created_at: string;
  is_default_system: boolean;
}

export interface LeaderboardExclusionMutationWire {
  excluded: boolean;
  refreshed: boolean;
  current_url: string | null;
  week_id: string | null;
}

export async function listLeaderboardExclusions(
  signal?: AbortSignal,
): Promise<LeaderboardExclusionWire[]> {
  const res = await client.get<{ success: true; data: LeaderboardExclusionWire[] }>(
    '/admin/leaderboard/exclusions',
    { signal },
  );
  return res.data.data;
}

export async function addLeaderboardExclusion(
  body: { user_id: string; note?: string | null },
  signal?: AbortSignal,
): Promise<LeaderboardExclusionMutationWire> {
  const res = await client.post<{ success: true; data: LeaderboardExclusionMutationWire }>(
    '/admin/leaderboard/exclusions',
    body,
    { signal },
  );
  return res.data.data;
}

export async function removeLeaderboardExclusion(
  userId: string,
  signal?: AbortSignal,
): Promise<LeaderboardExclusionMutationWire> {
  const res = await client.delete<{ success: true; data: LeaderboardExclusionMutationWire }>(
    `/admin/leaderboard/exclusions/${encodeURIComponent(userId)}`,
    { signal },
  );
  return res.data.data;
}