/**
 * React Query hooks untuk CRUD artikel ensiklopedia (admin console).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminArticleRequest,
  deleteAdminArticleRequest,
  listAdminArticlesRequest,
  listArticleRevisionsRequest,
  listCategoriesRequest,
  restoreArticleRevisionRequest,
  updateAdminArticleRequest,
} from '../infrastructure/encyclopedia-api';
import type {
  AdminArticleDetail,
  AdminArticleListItem,
  ArticlePayloadValues,
  ArticleStatus,
  ListAdminArticlesParams,
} from '../domain/encyclopedia';

/** Daftar artikel admin (semua status) dengan cursor pagination. */
export function useAdminArticleList(params: ListAdminArticlesParams = {}) {
  return useQuery({
    queryKey: ['encyclopedia', 'articles', params],
    queryFn: ({ signal }) => listAdminArticlesRequest(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

/** Create artikel (draft atau langsung tayang). */
export function useCreateAdminArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      slug?: string;
      title: string;
      excerpt: string;
      body_md: string;
      category_id: string;
      tags: string[];
      cover_url?: string | null;
      source_url?: string | null;
      references_md?: string | null;
      status?: 'draft' | 'published';
    }) => createAdminArticleRequest(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'articles'] });
    },
  });
}

/** Update artikel (menulis snapshot revisi). */
export function useUpdateAdminArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & ArticlePayloadValues & {
        status?: ArticleStatus;
        change_note?: string | null;
      }) => updateAdminArticleRequest(id, body),
    onSuccess: (data: AdminArticleDetail) => {
      void queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'articles'] });
      void queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'revisions', data.id] });
    },
  });
}

/** Arsipkan + soft delete artikel. */
export function useDeleteAdminArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminArticleRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'articles'] });
    },
  });
}

/** Riwayat revisi artikel (admin-only). */
export function useArticleRevisions(articleId: string, enabled = true) {
  return useQuery({
    queryKey: ['encyclopedia', 'revisions', articleId],
    queryFn: ({ signal }) => listArticleRevisionsRequest(articleId, signal),
    enabled: enabled && Boolean(articleId),
    staleTime: 30 * 1000,
  });
}

/** Pulihkan artikel dari snapshot revisi. */
export function useRestoreArticleRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, revisionId }: { articleId: string; revisionId: string }) =>
      restoreArticleRevisionRequest(articleId, revisionId),
    onSuccess: (_data: AdminArticleDetail, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'revisions', variables.articleId] });
      void queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'articles'] });
    },
  });
}

/** Kategori ensiklopedia untuk dropdown form. */
export function useCategoryOptions() {
  return useQuery({
    queryKey: ['encyclopedia', 'categories'],
    queryFn: ({ signal }) => listCategoriesRequest(signal),
    staleTime: 10 * 60 * 1000,
  });
}

/** Helper tipe item list (untuk props drawer). */
export type { AdminArticleListItem };