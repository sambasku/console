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

/** POST /api/v1/admin/comments/:id/approve-image (JSON) */
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

/** POST /api/v1/admin/comments/:id/approve-image (multipart sensor gambar) */
export async function censorCommentImageRequest(
  id: string,
  blob: Blob,
  contentWarnings: string[] = [],
): Promise<AdminCommentItem> {
  const form = new FormData();
  form.append('image', blob, 'censored.webp');
  form.append('content_warnings', JSON.stringify(contentWarnings));
  const res = await client.post<ApiOkEnvelope<AdminCommentItem>>(
    `/admin/comments/${id}/approve-image`,
    form,
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

export type ExploreCommentModule =
  | 'place'
  | 'culinary'
  | 'usaha'
  | 'event'
  | 'karya'
  | 'encyclopedia';

export interface AdminExploreCommentItem {
  id: string;
  module: ExploreCommentModule;
  target_id: string;
  target_name: string;
  target_slug: string;
  user_id: string;
  author_username: string | null;
  author_display_name: string | null;
  body: string;
  body_original: string | null;
  is_censored: boolean;
  status: 'published' | 'taken_down' | 'deleted_by_author';
  audio_url: string | null;
  audio_mime_type: string | null;
  audio_duration_ms: number | null;
  image: {
    status: 'pending_review' | 'published' | 'rejected';
    url: string | null;
    public_url: string | null;
    content_warnings: string[];
  } | null;
  created_at: string;
  updated_at: string | null;
}

export interface ListExploreCommentsParams {
  module: ExploreCommentModule;
  status?: 'published' | 'taken_down' | 'deleted_by_author';
  hasMedia?: 'image' | 'audio' | 'any';
  imageStatus?: 'pending_review' | 'published' | 'rejected';
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface ListExploreCommentsResult {
  items: AdminExploreCommentItem[];
  next_cursor: string | null;
  has_more: boolean;
}

export async function listExploreCommentsRequest(
  params: ListExploreCommentsParams,
  signal?: AbortSignal,
): Promise<ListExploreCommentsResult> {
  const res = await client.get<ApiOkEnvelope<ListExploreCommentsResult>>(
    '/admin/explore-comments',
    {
      params: {
        module: params.module,
        status: params.status,
        has_media: params.hasMedia,
        image_status: params.imageStatus,
        q: params.q?.trim() || undefined,
        limit: params.limit ?? 25,
        cursor: params.cursor,
      },
      signal,
    },
  );
  return res.data.data;
}

export async function takedownExploreCommentRequest(
  module: ExploreCommentModule,
  id: string,
): Promise<{ id: string; status: 'taken_down' }> {
  const res = await client.post<ApiOkEnvelope<{ id: string; status: 'taken_down' }>>(
    `/admin/explore-comments/${module}/${id}/takedown`,
  );
  return res.data.data;
}

export async function approveExploreCommentImageRequest(
  module: ExploreCommentModule,
  id: string,
  contentWarnings: string[] = [],
): Promise<{ id: string; image_public_url: string; content_warnings: string[] }> {
  const res = await client.post<
    ApiOkEnvelope<{ id: string; image_public_url: string; content_warnings: string[] }>
  >(`/admin/explore-comments/${module}/${id}/censor-image`, {
    content_warnings: contentWarnings,
  });
  return res.data.data;
}

export async function censorExploreCommentImageRequest(
  module: ExploreCommentModule,
  id: string,
  blob: Blob,
  contentWarnings: string[] = [],
): Promise<{ id: string; image_public_url: string; content_warnings: string[] }> {
  const form = new FormData();
  form.append('image', blob, 'censored.webp');
  form.append('content_warnings', JSON.stringify(contentWarnings));
  const res = await client.post<
    ApiOkEnvelope<{ id: string; image_public_url: string; content_warnings: string[] }>
  >(`/admin/explore-comments/${module}/${id}/censor-image`, form);
  return res.data.data;
}

export async function rejectExploreCommentImageRequest(
  module: ExploreCommentModule,
  id: string,
  abusive = false,
): Promise<{ id: string; image_status: 'rejected' }> {
  const res = await client.post<ApiOkEnvelope<{ id: string; image_status: 'rejected' }>>(
    `/admin/explore-comments/${module}/${id}/reject-image`,
    { abusive },
  );
  return res.data.data;
}
