import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCursorList } from '@/shared/hooks/use-cursor-list';
import type { Usaha, UsahaPublishStatus } from '../domain/usaha';
import {
  createUsahaRequest,
  deleteUsahaRequest,
  listUsahaCategoriesRequest,
  listUsahaDuplicatesRequest,
  listUsahaRequest,
  restoreUsahaRequest,
  restrictUsahaRequest,
  updateUsahaRequest,
  type UsahaInput,
} from '../infrastructure/usaha-api';
import {
  approveUsahaContributionRequest,
  listUsahaContributionsRequest,
  rejectUsahaContributionRequest,
  requestUsahaRevisionRequest,
} from '../infrastructure/usaha-contribution-api';
import {
  approveUsahaClaimRequest,
  listUsahaClaimsRequest,
  listUsahaReportsRequest,
  rejectUsahaClaimRequest,
  resolveUsahaReportRequest,
} from '../infrastructure/usaha-moderation-api';

const PAGE_LIMIT = 30;

export function useUsahaList(
  enabled = true,
  filters: {
    q?: string;
    category_id?: string;
    region_id?: string;
    status?: UsahaPublishStatus;
    operational_status?: Usaha['operationalStatus'];
  } = {},
) {
  return useCursorList<Usaha>({
    queryKey: ['usaha', filters],
    enabled,
    fetcher: async (cursor, signal) => {
      const page = await listUsahaRequest(
        {
          limit: PAGE_LIMIT,
          before: cursor,
          q: filters.q,
          category_id: filters.category_id,
          region_id: filters.region_id,
          status: filters.status,
          operational_status: filters.operational_status,
        },
        signal,
      );
      return {
        data: page.items,
        meta: {
          limit: PAGE_LIMIT,
          next_cursor: page.nextCursor,
          has_more: page.nextCursor != null,
        },
      };
    },
  });
}

export function useUsahaCategories(enabled = true) {
  return useQuery({
    queryKey: ['usaha', 'categories'],
    queryFn: ({ signal }) => listUsahaCategoriesRequest(signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateUsaha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUsahaRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha'] }),
  });
}

export function useUpdateUsaha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<UsahaInput>) =>
      updateUsahaRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha'] }),
  });
}

export function useDeleteUsaha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUsahaRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha'] }),
  });
}

export function useRestrictUsaha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      restrictUsahaRequest(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha'] }),
  });
}

export function useRestoreUsaha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreUsahaRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha'] }),
  });
}

/** Saran duplikat, dimuat saat drawer dibuka (read-only). */
export function useUsahaDuplicates(usahaId: string | null) {
  return useQuery({
    queryKey: ['usaha', 'duplicates', usahaId],
    queryFn: ({ signal }) => listUsahaDuplicatesRequest(usahaId!, signal),
    enabled: !!usahaId,
    staleTime: 30_000,
  });
}

export function usePendingUsahaContributions(enabled = true) {
  return useQuery({
    queryKey: ['usaha-contributions', 'pending'],
    queryFn: ({ signal }) =>
      listUsahaContributionsRequest({ status: 'pending' }, signal),
    enabled,
    staleTime: 15_000,
  });
}

export function useReviewUsahaContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      action: 'approve' | 'reject' | 'request-revision';
      reason?: { reason_code: string; reason_text?: string | null };
      note?: string;
    }) => {
      if (params.action === 'approve') return approveUsahaContributionRequest(params.id);
      if (params.action === 'reject') {
        return rejectUsahaContributionRequest(
          params.id,
          params.reason ?? { reason_code: 'other' },
        );
      }
      return requestUsahaRevisionRequest(params.id, params.note ?? '');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['usaha-contributions'] });
      void qc.invalidateQueries({ queryKey: ['usaha'] });
    },
  });
}

export function useUsahaClaims(params: { status?: 'pending' | 'approved' | 'rejected' | 'cancelled' }) {
  return useQuery({
    queryKey: ['usaha-claims', params],
    queryFn: ({ signal }) => listUsahaClaimsRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useReviewUsahaClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      action: 'approve' | 'reject';
      reason?: { reason_code: string; reason_text?: string | null };
    }) => {
      if (params.action === 'approve') return approveUsahaClaimRequest(params.id);
      return rejectUsahaClaimRequest(params.id, params.reason ?? { reason_code: 'other' });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['usaha-claims'] });
      void qc.invalidateQueries({ queryKey: ['usaha'] });
    },
  });
}

export function useUsahaReports(params: { status?: 'open' | 'resolved' | 'dismissed' }) {
  return useQuery({
    queryKey: ['usaha-reports', params],
    queryFn: ({ signal }) => listUsahaReportsRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useResolveUsahaReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      status: 'resolved' | 'dismissed';
      resolution: string;
      resolution_note?: string | null;
    }) => {
      const { id, ...body } = params;
      return resolveUsahaReportRequest(id, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha-reports'] }),
  });
}
