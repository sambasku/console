import { client } from '@/shared/api/client';
import type { ApiCursorPageEnvelope, ApiOkEnvelope, CursorPage } from '@/shared/api/types';
import type { LemmaMergeDetail, LemmaMergeListItem, LemmaMergeStatus } from '../domain/lemma-merge';

export async function listLemmaMergesRequest(
  params: { status?: LemmaMergeStatus; limit?: number; cursor?: string },
  signal?: AbortSignal,
): Promise<CursorPage<LemmaMergeListItem>> {
  const res = await client.get<ApiCursorPageEnvelope<LemmaMergeListItem>>('/admin/lemma-merges', {
    params: {
      status: params.status,
      limit: params.limit ?? 20,
      cursor: params.cursor,
    },
    signal,
  });
  return { data: res.data.data, meta: res.data.meta };
}

export async function getLemmaMergeDetailRequest(
  id: string,
  signal?: AbortSignal,
): Promise<LemmaMergeDetail> {
  const res = await client.get<ApiOkEnvelope<LemmaMergeDetail>>(`/admin/lemma-merges/${id}`, {
    signal,
  });
  return res.data.data;
}

export async function approveLemmaMergeRequest(id: string, reviewNote?: string) {
  const res = await client.post<ApiOkEnvelope<{ id: string; message?: string }>>(
    `/admin/lemma-merges/${id}/approve`,
    reviewNote ? { review_note: reviewNote } : {},
  );
  return res.data.data;
}

export async function rejectLemmaMergeRequest(id: string, reviewNote?: string) {
  const res = await client.post<ApiOkEnvelope<{ id: string; message?: string }>>(
    `/admin/lemma-merges/${id}/reject`,
    reviewNote ? { review_note: reviewNote } : {},
  );
  return res.data.data;
}