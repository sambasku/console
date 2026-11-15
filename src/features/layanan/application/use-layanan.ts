import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveLayananContribution,
  createAdminLayanan,
  listAdminLayanan,
  listLayananQueue,
  rejectLayananContribution,
  reviseLayananContribution,
  setLayananPublished,
  updateAdminLayanan,
  type LayananInput,
} from '../infrastructure/layanan-api';

const key = ['layanan'] as const;

export function useAdminLayanan() {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => listAdminLayanan(signal) });
}

export function useLayananQueue() {
  return useQuery({
    queryKey: [...key, 'queue'],
    queryFn: ({ signal }) => listLayananQueue(signal),
  });
}

export function useLayananMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  return {
    create: useMutation({ mutationFn: createAdminLayanan, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: LayananInput }) => updateAdminLayanan(id, body),
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: ({ id, published }: { id: string; published: boolean }) =>
        setLayananPublished(id, published),
      onSuccess: refresh,
    }),
    approve: useMutation({ mutationFn: approveLayananContribution, onSuccess: refresh }),
    reject: useMutation({ mutationFn: rejectLayananContribution, onSuccess: refresh }),
    revise: useMutation({
      mutationFn: ({ id, note }: { id: string; note: string }) => reviseLayananContribution(id, note),
      onSuccess: refresh,
    }),
  };
}
