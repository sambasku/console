import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCursorList } from '@/shared/hooks/use-cursor-list';
import type { Place } from '../domain/place';
import {
  createPlaceRequest,
  deletePlaceRequest,
  getPlaceViewsReportRequest,
  listPlaceViewsRequest,
  listPlacesRequest,
  updatePlaceRequest,
  type PlaceInput,
} from '../infrastructure/place-api';
import type { PlaceCategory, PlaceStatus } from '../domain/place';

const PAGE_LIMIT = 30;

export function usePlaceList(
  enabled = true,
  filters: { q?: string; category?: PlaceCategory; status?: PlaceStatus } = {},
) {
  return useCursorList<Place>({
    queryKey: ['places', filters],
    enabled,
    fetcher: async (cursor, signal) => {
      const page = await listPlacesRequest(
        {
          limit: PAGE_LIMIT,
          before: cursor,
          q: filters.q,
          category: filters.category,
          status: filters.status,
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

export function useCreatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlaceRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}

export function useUpdatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<PlaceInput>) =>
      updatePlaceRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}

export function useDeletePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlaceRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}

/** Total view per place untuk kolom "Dilihat" (undefined days = semua). */
export function usePlaceViews(days?: number) {
  return useQuery({
    queryKey: ['places', 'views', days ?? 'all'],
    queryFn: ({ signal }) => listPlaceViewsRequest(days, signal),
    staleTime: 60_000,
  });
}

/** Laporan tren + ranking halaman analitik wisata. */
export function usePlaceViewsReport(days: number) {
  return useQuery({
    queryKey: ['places', 'views', 'report', days],
    queryFn: ({ signal }) => getPlaceViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}
