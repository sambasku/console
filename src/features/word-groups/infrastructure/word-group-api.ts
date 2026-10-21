import { client } from '@/shared/api/client';
import type { WordGroupInput, WordGroupItem, WordGroupStatus } from '../domain/word-group';

// Kontrak API /api/v1/word-groups (docs: word-group.validator.ts).
// Admin semua status lewat /all; tulis (create/update/member) memakai auth.
interface WireMember {
  id: string;
  word_id: string;
  lemma: string;
  notes: string | null;
  status: WordGroupStatus;
}

interface Wire {
  id: string;
  name: string;
  description: string | null;
  status: WordGroupStatus;
  is_verified: boolean;
  members: WireMember[];
}

function mapItem(w: Wire): WordGroupItem {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    status: w.status,
    isVerified: w.is_verified,
    members: w.members.map((m) => ({
      id: m.id,
      wordId: m.word_id,
      lemma: m.lemma,
      notes: m.notes,
      status: m.status,
    })),
  };
}

interface ListQuery {
  q?: string;
  status?: WordGroupStatus;
  wordId?: string;
  before?: string;
  limit?: number;
}

function toParams(q: ListQuery): Record<string, string | number | undefined> {
  return {
    q: q.q || undefined,
    status: q.status,
    word_id: q.wordId,
    before: q.before,
    limit: q.limit ?? 50,
  };
}

export async function listWordGroupsRequest(
  params: ListQuery = {},
  signal?: AbortSignal,
): Promise<{ items: WordGroupItem[]; nextCursor: string | null }> {
  const res = await client.get<{
    success: true;
    data: { items: Wire[]; next_cursor: string | null };
  }>('/word-groups/all', { params: toParams(params), signal });
  return {
    items: res.data.data.items.map(mapItem),
    nextCursor: res.data.data.next_cursor,
  };
}

/** Muat semua halaman (kelompok makna tidak banyak - pola place-categories). */
export async function listAllWordGroupsRequest(
  params: Omit<ListQuery, 'before' | 'limit'> = {},
  signal?: AbortSignal,
): Promise<WordGroupItem[]> {
  const items: WordGroupItem[] = [];
  let before: string | undefined;
  for (;;) {
    const page = await listWordGroupsRequest({ ...params, limit: 50, before }, signal);
    items.push(...page.items);
    if (!page.nextCursor) break;
    before = page.nextCursor;
  }
  return items;
}

export async function getWordGroupRequest(id: string, signal?: AbortSignal): Promise<WordGroupItem> {
  const res = await client.get<{ success: true; data: Wire }>('/word-groups/all/by-id', {
    params: { id },
    signal,
  });
  return mapItem(res.data.data);
}

export async function createWordGroupRequest(body: WordGroupInput): Promise<WordGroupItem> {
  const res = await client.post<{ success: true; data: Wire }>('/word-groups', body);
  return mapItem(res.data.data);
}

export async function updateWordGroupRequest(
  id: string,
  body: Partial<WordGroupInput>,
): Promise<WordGroupItem> {
  const res = await client.patch<{ success: true; data: Wire }>('/word-groups/by-id', body, {
    params: { id },
  });
  return mapItem(res.data.data);
}

export async function deleteWordGroupRequest(id: string): Promise<void> {
  await client.delete('/word-groups/by-id', { params: { id } });
}

export async function addWordGroupMemberRequest(
  groupId: string,
  body: { word_id: string; notes?: string | null; status?: WordGroupStatus },
): Promise<WordGroupItem> {
  const res = await client.post<{ success: true; data: Wire }>('/word-groups/by-id/members', body, {
    params: { id: groupId },
  });
  return mapItem(res.data.data);
}

export async function removeWordGroupMemberRequest(
  groupId: string,
  wordId: string,
): Promise<void> {
  await client.delete('/word-groups/by-id/members', {
    params: { id: groupId, word_id: wordId },
  });
}
