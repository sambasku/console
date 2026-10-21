import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPlaceCategoryRequest,
  deletePlaceCategoryRequest,
  listAllPlaceCategoriesRequest,
  updatePlaceCategoryRequest,
  type PlaceCategoryInput,
} from '../infrastructure/place-category-api';

export function useAllPlaceCategories(enabled = true) {
  return useQuery({
    queryKey: ['place-categories', 'all'],
    queryFn: ({ signal }) => listAllPlaceCategoriesRequest({}, signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreatePlaceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlaceCategoryRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['place-categories'] }),
  });
}

export function useUpdatePlaceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<Omit<PlaceCategoryInput, 'id'>>) =>
      updatePlaceCategoryRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['place-categories'] }),
  });
}

export function useDeletePlaceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlaceCategoryRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['place-categories'] }),
  });
}
