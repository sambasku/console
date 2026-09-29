import { client } from '@/shared/api/client';
import type { ApiCursorPageEnvelope, ApiOkEnvelope, CursorPage } from '@/shared/api/types';
import type {
  ListDiscussionsParams,
  DiscussionDetail,
  DiscussionListItem,
  DiscussionReply,
} from '../domain/discussion';

/**
 * GET /api/v1/admin/discussions - antrean moderasi (filter status, cursor).
 */
export async function listDiscussionsRequest(
  params: ListDiscussionsParams,
  signal?: AbortSignal,
): Promise<CursorPage<DiscussionListItem>> {
  const res = await client.get<ApiCursorPageEnvelope<DiscussionListItem>>(
    '/admin/discussions',
    {
      params: {
        status: params.status,
        limit: params.limit ?? 20,
        cursor: params.cursor,
      },
      signal,
    },
  );
  return { data: res.data.data, meta: res.data.meta };
}

/**
 * GET /api/v1/admin/discussions/:id - detail + replies (URL ImageKit saat pending).
 */
export async function getDiscussionDetailRequest(
  id: string,
  signal?: AbortSignal,
): Promise<DiscussionDetail> {
  const res = await client.get<ApiOkEnvelope<DiscussionDetail>>(
    `/admin/discussions/${id}`,
    { signal },
  );
  return res.data.data;
}

export interface ApproveDiscussionPayload {
  censoredFiles?: (Blob | null)[];
  /** Sejajar jumlah gambar; tiap slot array warning (mis. ['kekerasan']). */
  contentWarnings?: string[][];
}

/**
 * POST /api/v1/admin/discussions/:id/approve
 * Multipart file_0..file_N + content_warnings JSON, atau JSON kosong / hanya warnings.
 */
export async function approveDiscussionRequest(
  id: string,
  payload?: ApproveDiscussionPayload,
): Promise<DiscussionListItem> {
  const censoredFiles = payload?.censoredFiles;
  const contentWarnings = payload?.contentWarnings;
  const hasCensored = censoredFiles?.some((f) => f != null && f.size > 0) ?? false;
  const hasWarnings =
    contentWarnings?.some((slot) => Array.isArray(slot) && slot.length > 0) ?? false;

  if (!hasCensored && !hasWarnings) {
    const res = await client.post<ApiOkEnvelope<DiscussionListItem>>(
      `/admin/discussions/${id}/approve`,
      {},
    );
    return res.data.data;
  }

  if (!hasCensored && hasWarnings && contentWarnings) {
    const res = await client.post<ApiOkEnvelope<DiscussionListItem>>(
      `/admin/discussions/${id}/approve`,
      { content_warnings: contentWarnings },
    );
    return res.data.data;
  }

  const form = new FormData();
  const files = censoredFiles ?? [];
  files.forEach((blob, i) => {
    if (blob && blob.size > 0) {
      form.append(`file_${i}`, blob, `censored_${i}.jpg`);
    } else {
      form.append(`file_${i}`, new Blob([], { type: 'application/octet-stream' }), `empty_${i}`);
    }
  });
  if (contentWarnings) {
    form.append('content_warnings', JSON.stringify(contentWarnings));
  }

  const res = await client.post<ApiOkEnvelope<DiscussionListItem>>(
    `/admin/discussions/${id}/approve`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData && headers) {
            delete headers['Content-Type'];
          }
          return data;
        },
      ],
    },
  );
  return res.data.data;
}

/** POST /api/v1/admin/discussions/:id/reject - note wajib. */
export async function rejectDiscussionRequest(
  id: string,
  note: string,
): Promise<DiscussionListItem> {
  const res = await client.post<ApiOkEnvelope<DiscussionListItem>>(
    `/admin/discussions/${id}/reject`,
    { note },
  );
  return res.data.data;
}

/** POST /api/v1/admin/discussions/:id/takedown - tarik dari feed. */
export async function takedownDiscussionRequest(id: string): Promise<DiscussionListItem> {
  const res = await client.post<ApiOkEnvelope<DiscussionListItem>>(
    `/admin/discussions/${id}/takedown`,
  );
  return res.data.data;
}

/** POST /api/v1/admin/discussions/:id/pin-reply */
export async function pinDiscussionReplyRequest(
  discussionId: string,
  replyId: string,
): Promise<DiscussionListItem> {
  const res = await client.post<ApiOkEnvelope<DiscussionListItem>>(
    `/admin/discussions/${discussionId}/pin-reply`,
    { reply_id: replyId },
  );
  return res.data.data;
}

/** POST /api/v1/admin/discussions/replies/:id/takedown */
export async function takedownDiscussionReplyRequest(
  replyId: string,
): Promise<DiscussionReply> {
  const res = await client.post<ApiOkEnvelope<DiscussionReply>>(
    `/admin/discussions/replies/${replyId}/takedown`,
  );
  return res.data.data;
}
