import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCursorList } from '@/shared/hooks/use-cursor-list';
import type { Place } from '../domain/place';
import {
  createPlaceRequest,
  deletePlaceRequest,
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
