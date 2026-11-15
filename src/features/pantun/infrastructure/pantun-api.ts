import { client } from '@/shared/api/client';

export interface PantunRow {
  id: string;
  userId: string;
  displayName: string | null;
  username: string | null;
  language: string;
  rhymeScheme: string;
  lines: string[];
  audioUrl: string | null;
  audioDurationMs: number | null;
  status: string;
  createdAt: string;
}

interface PantunWire {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  language: string;
  rhyme_scheme: string;
  lines: string[];
  audio_url?: string | null;
  audio_duration_ms?: number | null;
  status: string;
  created_at: string;
}

export async function listPantunsRequest(signal?: AbortSignal): Promise<PantunRow[]> {
  const res = await client.get<{
    success: true;
    data: PantunWire[];
    meta: { has_more: boolean; next_cursor: string | null };
  }>('/admin/pantuns', { params: { limit: 50 }, signal });
  return res.data.data.map((w) => ({
    id: w.id,
    userId: w.user_id,
    displayName: w.display_name,
    username: w.username,
    language: w.language,
    rhymeScheme: w.rhyme_scheme,
    lines: w.lines,
    audioUrl: w.audio_url ?? null,
    audioDurationMs: w.audio_duration_ms ?? null,
    status: w.status,
    createdAt: w.created_at,
  }));
}

export async function takedownPantunRequest(id: string): Promise<void> {
  await client.post(`/admin/pantuns/${id}/takedown`);
}

export async function takedownPantunReplyRequest(id: string): Promise<void> {
  await client.post(`/admin/pantuns/replies/${id}/takedown`);
}
