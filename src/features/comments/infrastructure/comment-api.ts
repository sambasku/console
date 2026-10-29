import { client } from '@/shared/api/client';
import type { ApiCursorPageEnvelope, ApiOkEnvelope, CursorPage } from '@/shared/api/types';
import type {
  AdminCommentItem,
  ListCommentsParams,
  TakedownCommentResult,
  UncensorCommentResult,
} from '../domain/comment';

export async function listAdminCommentsRequest(
  params: ListCommentsParams,
  signal?: AbortSignal,
): Promise<CursorPage<AdminCommentItem>> {
  const res = await client.get<ApiCursorPageEnvelope<AdminCommentItem>>('/admin/comments', {
    params: {
      status: params.status,
      word_id: params.wordId,
      image_status: params.imageStatus,
      limit: params.limit ?? 20,
      cursor: params.cursor,
    },
    signal,
  });
  return { data: res.data.data, meta: res.data.meta };
}

/** POST /api/v1/admin/comments/:id/takedown */
export async function takedownCommentRequest(id: string): Promise<TakedownCommentResult> {
  const res = await client.post<ApiOkEnvelope<TakedownCommentResult>>(`/admin/comments/${id}/takedown`);
  return res.data.data;
}

/** POST /api/v1/admin/comments/:id/uncensor */
export async function uncensorCommentRequest(id: string): Promise<UncensorCommentResult> {
  const res = await client.post<ApiOkEnvelope<UncensorCommentResult>>(`/admin/comments/${id}/uncensor`);
  return res.data.data;
}

/** POST /api/v1/admin/comments/:id/approve-image */
export async function approveCommentImageRequest(
  id: string,
  contentWarnings: string[] = [],
): Promise<AdminCommentItem> {
  const res = await client.post<ApiOkEnvelope<AdminCommentItem>>(
    `/admin/comments/${id}/approve-image`,
    { content_warnings: contentWarnings },
  );
  return res.data.data;
}

/** POST /api/v1/admin/comments/:id/reject-image */
export async function rejectCommentImageRequest(
  id: string,
  abusive = false,
): Promise<AdminCommentItem> {
  const res = await client.post<ApiOkEnvelope<AdminCommentItem>>(
    `/admin/comments/${id}/reject-image`,
    { abusive },
  );
  return res.data.data;
}
