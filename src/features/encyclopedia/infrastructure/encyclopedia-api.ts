/**
 * API calls Ensiklopedia (console) - kontrak wire API:
 * - /api/v1/admin/encyclopedia/* (admin)
 * - /api/v1/encyclopedia/* (publik/autentikasi)
 *
 * Wire list: { success: true, data: { items, next_cursor, has_more } }
 * (laporan admin masih camelCase: nextCursor / hasMore).
 * Console internal: CursorPage<T> { items, next_cursor, has_more }
 */
import type { AxiosResponse } from 'axios';
import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  AdminArticleDetail,
  AdminArticleListItem,
  ArticleContribution,
  ArticlePayload,
  ArticlePayloadValues,
  ArticleReportListItem,
  ArticleRevision,
  CursorPage,
  EncyclopediaCategoryItem,
  EncyclopediaTagItem,
  ListAdminArticlesParams,
  ListAdminContributionsParams,
  ListAdminReportsParams,
  ReviewDecisionResult,
} from '../domain/encyclopedia';

type EncyclopediaPageWire<T> = {
  items?: T[];
  next_cursor?: string | null;
  has_more?: boolean;
  nextCursor?: string | null;
  hasMore?: boolean;
};

/** Konversi envelope list ensiklopedia → CursorPage console. */
function toCursorPage<T>(res: AxiosResponse<ApiOkEnvelope<EncyclopediaPageWire<T>>>): CursorPage<T> {
  const page = res.data.data ?? {};
  return {
    items: Array.isArray(page.items) ? page.items : [],
    next_cursor: page.next_cursor ?? page.nextCursor ?? null,
    has_more: page.has_more ?? page.hasMore ?? false,
  };
}

// ---- Admin: Artikel ----

/** GET /api/v1/admin/encyclopedia/articles */
export async function listAdminArticlesRequest(
  params: ListAdminArticlesParams = {},
  signal?: AbortSignal,
): Promise<CursorPage<AdminArticleListItem>> {
  const res = await client.get<ApiOkEnvelope<EncyclopediaPageWire<AdminArticleListItem>>>(
    '/admin/encyclopedia/articles',
    {
      params: {
        status: params.status,
        category_id: params.category_id,
        q: params.q,
        cursor: params.cursor,
        limit: params.limit ?? 20,
      },
      signal,
    },
  );
  return toCursorPage(res);
}

/** GET /api/v1/encyclopedia/articles/:slug - detail untuk edit (body_md ada). */
export async function getArticleBySlugRequest(
  slug: string,
  signal?: AbortSignal,
): Promise<AdminArticleDetail> {
  const res = await client.get<ApiOkEnvelope<AdminArticleDetail>>(`/encyclopedia/articles/${slug}`, { signal });
  return res.data.data;
}

/** POST /api/v1/admin/encyclopedia/articles */
export async function createAdminArticleRequest(
  body: { slug?: string } & ArticlePayload & { status?: 'draft' | 'published' },
  signal?: AbortSignal,
): Promise<AdminArticleDetail> {
  const res = await client.post<ApiOkEnvelope<AdminArticleDetail>>('/admin/encyclopedia/articles', body, { signal });
  return res.data.data;
}

/** PATCH /api/v1/admin/encyclopedia/articles/:id */
export async function updateAdminArticleRequest(
  id: string,
  body: ArticlePayloadValues & { status?: 'draft' | 'published' | 'archived'; change_note?: string | null },
  signal?: AbortSignal,
): Promise<AdminArticleDetail> {
  const res = await client.patch<ApiOkEnvelope<AdminArticleDetail>>(`/admin/encyclopedia/articles/${id}`, body, { signal });
  return res.data.data;
}

/** DELETE /api/v1/admin/encyclopedia/articles/:id */
export async function deleteAdminArticleRequest(
  id: string,
  signal?: AbortSignal,
): Promise<{ deleted: boolean }> {
  const res = await client.delete<ApiOkEnvelope<{ deleted: boolean }>>(`/admin/encyclopedia/articles/${id}`, { signal });
  return res.data.data;
}

/** GET /api/v1/admin/encyclopedia/articles/:id/revisions */
export async function listArticleRevisionsRequest(
  articleId: string,
  signal?: AbortSignal,
): Promise<{ items: ArticleRevision[] }> {
  const res = await client.get<ApiOkEnvelope<{ items: ArticleRevision[] }>>(
    `/admin/encyclopedia/articles/${articleId}/revisions`,
    { signal },
  );
  return res.data.data;
}

/** POST /api/v1/admin/encyclopedia/articles/:id/revisions/:revisionId/restore */
export async function restoreArticleRevisionRequest(
  articleId: string,
  revisionId: string,
  signal?: AbortSignal,
): Promise<AdminArticleDetail> {
  const res = await client.post<ApiOkEnvelope<AdminArticleDetail>>(
    `/admin/encyclopedia/articles/${articleId}/revisions/${revisionId}/restore`,
    {},
    { signal },
  );
  return res.data.data;
}

// ---- Admin: Kategori ----

/** GET /api/v1/encyclopedia/categories - dropdown form. */
export async function listCategoriesRequest(signal?: AbortSignal): Promise<EncyclopediaCategoryItem[]> {
  const res = await client.get<ApiOkEnvelope<{ items: EncyclopediaCategoryItem[] }>>('/encyclopedia/categories', {
    signal,
  });
  const items = res.data.data?.items;
  return Array.isArray(items) ? items : [];
}

/** POST /api/v1/admin/encyclopedia/categories */
export async function createCategoryRequest(
  body: { id: string; name: string; sort_order?: number },
  signal?: AbortSignal,
): Promise<EncyclopediaCategoryItem> {
  const res = await client.post<ApiOkEnvelope<EncyclopediaCategoryItem>>(
    '/admin/encyclopedia/categories',
    body,
    { signal },
  );
  return res.data.data;
}

/** PATCH /api/v1/admin/encyclopedia/categories/:id */
export async function updateCategoryRequest(
  id: string,
  body: { name?: string; status?: 'draft' | 'published' | 'archived'; sort_order?: number },
  signal?: AbortSignal,
): Promise<EncyclopediaCategoryItem> {
  const res = await client.patch<ApiOkEnvelope<EncyclopediaCategoryItem>>(
    `/admin/encyclopedia/categories/${id}`,
    body,
    { signal },
  );
  return res.data.data;
}

// ---- Admin: Tag ----

/** GET /api/v1/encyclopedia/tags - autocomplete. */
export async function listTagsRequest(
  params: { q?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<EncyclopediaTagItem[]> {
  const res = await client.get<ApiOkEnvelope<{ items: EncyclopediaTagItem[] }>>('/encyclopedia/tags', {
    params: { q: params.q, limit: params.limit ?? 20 },
    signal,
  });
  const items = res.data.data?.items;
  return Array.isArray(items) ? items : [];
}

/** PATCH /api/v1/admin/encyclopedia/tags/:id */
export async function renameTagRequest(
  id: string,
  body: { name: string },
  signal?: AbortSignal,
): Promise<EncyclopediaTagItem> {
  const res = await client.patch<ApiOkEnvelope<EncyclopediaTagItem>>(`/admin/encyclopedia/tags/${id}`, body, { signal });
  return res.data.data;
}

/** POST /api/v1/admin/encyclopedia/tags/merge */
export async function mergeTagRequest(
  body: { from_tag_id: string; into_tag_id: string },
  signal?: AbortSignal,
): Promise<{ merged: boolean }> {
  const res = await client.post<ApiOkEnvelope<{ merged: boolean }>>('/admin/encyclopedia/tags/merge', body, { signal });
  return res.data.data;
}

// ---- Admin: Contributions ----

/** GET /api/v1/admin/encyclopedia/contributions */
export async function listAdminContributionsRequest(
  params: ListAdminContributionsParams = {},
  signal?: AbortSignal,
): Promise<CursorPage<ArticleContribution>> {
  const res = await client.get<ApiOkEnvelope<EncyclopediaPageWire<ArticleContribution>>>('/admin/encyclopedia/contributions', {
    params: { status: params.status, cursor: params.cursor, limit: params.limit ?? 20 },
    signal,
  });
  return toCursorPage(res);
}

/** POST /api/v1/admin/encyclopedia/contributions/:id/review */
export async function reviewContributionRequest(
  id: string,
  body: {
    decision: 'approve' | 'needs_revision' | 'reject';
    revision_note?: string | null;
    reject_reason_code?: string | null;
    reject_reason_text?: string | null;
  },
  signal?: AbortSignal,
): Promise<ReviewDecisionResult> {
  const res = await client.post<ApiOkEnvelope<ReviewDecisionResult>>(
    `/admin/encyclopedia/contributions/${id}/review`,
    body,
    { signal },
  );
  return res.data.data;
}

// ---- Admin: Reports ----

/** GET /api/v1/admin/encyclopedia/reports */
export async function listAdminReportsRequest(
  params: ListAdminReportsParams = {},
  signal?: AbortSignal,
): Promise<CursorPage<ArticleReportListItem>> {
  const res = await client.get<ApiOkEnvelope<EncyclopediaPageWire<ArticleReportListItem>>>('/admin/encyclopedia/reports', {
    params: { status: params.status, cursor: params.cursor, limit: params.limit ?? 20 },
    signal,
  });
  return toCursorPage(res);
}

/** POST /api/v1/admin/encyclopedia/reports/:id/resolve */
export async function resolveReportRequest(
  id: string,
  body: { resolution: 'dismissed' | 'taken_down'; note?: string | null },
  signal?: AbortSignal,
): Promise<{ resolved: boolean }> {
  const res = await client.post<ApiOkEnvelope<{ resolved: boolean }>>(
    `/admin/encyclopedia/reports/${id}/resolve`,
    body,
    { signal },
  );
  return res.data.data;
}

/** POST /api/v1/admin/encyclopedia/comments/:id/takedown */
export async function takedownCommentRequest(
  id: string,
  signal?: AbortSignal,
): Promise<{ message: string }> {
  const res = await client.post<ApiOkEnvelope<{ message: string }>>(`/admin/encyclopedia/comments/${id}/takedown`, {}, { signal });
  return res.data.data;
}

// ---- Image upload (ImageKit direct from browser) ----
export { uploadImageToCdn } from '@/shared/api/image-upload';