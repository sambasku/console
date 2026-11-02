import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCursorList } from '@/shared/hooks/use-cursor-list';
import type {
  Cuisine,
  CulinaryCategoryRef,
  CulinaryContribution,
  CulinaryPlace,
  CulinaryPlaceType,
  CulinaryPublishStatus,
} from '../domain/culinary';
import {
  createCuisineRequest,
  createPlaceRequest,
  deleteCuisineRequest,
  deletePlaceRequest,
  listCulinaryCategoriesRequest,
  listCuisinesRequest,
  listPlacesRequest,
  restoreCuisineRequest,
  restorePlaceRequest,
  restrictCuisineRequest,
  restrictPlaceRequest,
  updateCuisineRequest,
  updatePlaceRequest,
  type CuisineInput,
  type PlaceInput,
} from '../infrastructure/culinary-api';
import {
  approveCulinaryContributionRequest,
  listCulinaryContributionsRequest,
  rejectCulinaryContributionRequest,
  requestCulinaryRevisionRequest,
} from '../infrastructure/culinary-contribution-api';
import {
  approveCulinaryClaimRequest,
  listCulinaryClaimsRequest,
  listCulinaryReportsRequest,
  rejectCulinaryClaimRequest,
  resolveCulinaryReportRequest,
} from '../infrastructure/culinary-moderation-api';

const PAGE_LIMIT = 30;

export function useCuisines(
  enabled = true,
  filters: {
    q?: string;
    category_id?: string;
    status?: CulinaryPublishStatus;
  } = {},
) {
  return useCursorList<Cuisine>({
    queryKey: ['culinary', 'cuisines', filters],
    enabled,
    fetcher: async (cursor, signal) => {
      const page = await listCuisinesRequest(
        { limit: PAGE_LIMIT, before: cursor, ...filters },
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

export function useCulinaryPlaces(
  enabled = true,
  filters: {
    q?: string;
    type?: CulinaryPlaceType;
    status?: CulinaryPublishStatus;
    operational_status?: CulinaryPlace['operationalStatus'];
  } = {},
) {
  return useCursorList<CulinaryPlace>({
    queryKey: ['culinary', 'places', filters],
    enabled,
    fetcher: async (cursor, signal) => {
      const page = await listPlacesRequest(
        { limit: PAGE_LIMIT, before: cursor, ...filters },
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

export function useCulinaryCategories(enabled = true) {
  return useQuery({
    queryKey: ['culinary', 'categories'],
    queryFn: ({ signal }) => listCulinaryCategoriesRequest(signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateCuisine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CuisineInput) => createCuisineRequest(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useUpdateCuisine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<CuisineInput>) =>
      updateCuisineRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useDeleteCuisine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCuisineRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useRestrictCuisine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      restrictCuisineRequest(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useRestoreCuisine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreCuisineRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useCreatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlaceInput) => createPlaceRequest(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useUpdatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<PlaceInput>) =>
      updatePlaceRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useDeletePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlaceRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useRestrictPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      restrictPlaceRequest(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function useRestorePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restorePlaceRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary'] }),
  });
}

export function usePendingCulinaryContributions(enabled = true) {
  return useQuery({
    queryKey: ['culinary-contributions', { status: 'pending' }],
    queryFn: ({ signal }) =>
      listCulinaryContributionsRequest({ status: 'pending' }, signal),
    enabled,
    staleTime: 15_000,
  });
}

export function useCulinaryContributions(params: {
  status?: CulinaryContribution['status'];
  kind?: CulinaryContribution['kind'];
}) {
  return useQuery({
    queryKey: ['culinary-contributions', params],
    queryFn: ({ signal }) => listCulinaryContributionsRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useReviewCulinaryContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      action: 'approve' | 'reject' | 'request-revision';
      reason?: { reason_code: string; reason_text?: string | null };
      note?: string;
    }) => {
      if (params.action === 'approve') {
        return approveCulinaryContributionRequest(params.id);
      }
      if (params.action === 'reject') {
        return rejectCulinaryContributionRequest(
          params.id,
          params.reason ?? { reason_code: 'other' },
        );
      }
      return requestCulinaryRevisionRequest(params.id, params.note ?? '');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['culinary-contributions'] });
      void qc.invalidateQueries({ queryKey: ['culinary'] });
    },
  });
}

export function useCulinaryClaims(params: {
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
}) {
  return useQuery({
    queryKey: ['culinary-claims', params],
    queryFn: ({ signal }) => listCulinaryClaimsRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useReviewCulinaryClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      action: 'approve' | 'reject';
      reason?: { reason_code: string; reason_text?: string | null };
    }) => {
      if (params.action === 'approve') return approveCulinaryClaimRequest(params.id);
      return rejectCulinaryClaimRequest(
        params.id,
        params.reason ?? { reason_code: 'other' },
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['culinary-claims'] });
      void qc.invalidateQueries({ queryKey: ['culinary'] });
    },
  });
}

export function useCulinaryReports(params: {
  status?: 'open' | 'resolved' | 'dismissed';
}) {
  return useQuery({
    queryKey: ['culinary-reports', params],
    queryFn: ({ signal }) => listCulinaryReportsRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useResolveCulinaryReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      status: 'resolved' | 'dismissed';
      resolution: string;
      resolution_note?: string | null;
    }) => {
      const { id, ...body } = params;
      return resolveCulinaryReportRequest(id, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary-reports'] }),
  });
}

export type { CulinaryCategoryRef };
