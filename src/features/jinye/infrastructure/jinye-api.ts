import { client } from '@/shared/api/client';

export type JinyeStatus =
  | 'published'
  | 'archived'
  | 'taken_down'
  | 'deleted_by_author';

export interface JinyeRow {
  id: string;
  userId: string;
  displayName: string | null;
  username: string | null;
  body: string | null;
  hasImages: boolean;
  hasAudio: boolean;
  status: JinyeStatus | string;
  createdAt: string;
}

interface JinyeWire {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  body: string | null;
  images?: Array<{ public_url?: string | null; url?: string }>;
  audio?: { audio_url?: string | null } | null;
  status: string;
  created_at: string;
}

export async function listJinyeRequest(
  params: {
    limit?: number;
    status?: JinyeStatus;
    username?: string;
  } = {},
  signal?: AbortSignal,
): Promise<JinyeRow[]> {
  const res = await client.get<{
    success: true;
    data: JinyeWire[];
    meta: { has_more: boolean; next_cursor: string | null };
  }>('/admin/jinye', {
    params: {
      limit: 50,
      ...(params.status ? { status: params.status } : {}),
      ...(params.username?.trim() ? { username: params.username.trim() } : {}),
    },
    signal,
  });
  return res.data.data.map((w) => ({
    id: w.id,
    userId: w.user_id,
    displayName: w.display_name,
    username: w.username,
    body: w.body,
    hasImages: Array.isArray(w.images) && w.images.length > 0,
    hasAudio: !!w.audio?.audio_url,
    status: w.status,
    createdAt: w.created_at,
  }));
}

export async function takedownJinyeRequest(id: string): Promise<void> {
  await client.post(`/admin/jinye/${id}/takedown`);
}
