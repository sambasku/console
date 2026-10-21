import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRegionRequest,
  deleteRegionRequest,
  listAllRegionsRequest,
  updateRegionRequest,
  type RegionInput,
} from '../infrastructure/region-api';

export function useAllRegions(enabled = true) {
  return useQuery({
    queryKey: ['regions', 'catalog'],
    queryFn: ({ signal }) => listAllRegionsRequest({}, signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRegionRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
  });
}

export function useUpdateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<Omit<RegionInput, 'slug' | 'type'>>) =>
      updateRegionRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
  });
}

export function useDeleteRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRegionRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
  });
}
