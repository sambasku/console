import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveKaryaContribution,
  createAdminKarya,
  listAdminKarya,
  listKaryaQueue,
  rejectKaryaContribution,
  reviseKaryaContribution,
  setKaryaPublished,
  updateAdminKarya,
  type KaryaInput,
} from '../infrastructure/karya-api';

const key = ['karya'] as const;

export function useAdminKarya() {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => listAdminKarya(signal) });
}

export function useKaryaQueue() {
  return useQuery({
    queryKey: [...key, 'queue'],
    queryFn: ({ signal }) => listKaryaQueue(signal),
  });
}

export function useKaryaMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  return {
    create: useMutation({ mutationFn: createAdminKarya, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: KaryaInput }) => updateAdminKarya(id, body),
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: ({ id, published }: { id: string; published: boolean }) =>
        setKaryaPublished(id, published),
      onSuccess: refresh,
    }),
    approve: useMutation({ mutationFn: approveKaryaContribution, onSuccess: refresh }),
    reject: useMutation({ mutationFn: rejectKaryaContribution, onSuccess: refresh }),
    revise: useMutation({
      mutationFn: ({ id, note }: { id: string; note: string }) => reviseKaryaContribution(id, note),
      onSuccess: refresh,
    }),
  };
}
