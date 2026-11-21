import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveBaleho,
  listAdminBaleho,
  markPaidBaleho,
  pauseBaleho,
  rejectBaleho,
  resumeBaleho,
} from '../infrastructure/baleho-api';

const key = ['admin', 'baleho', 'placements'] as const;

export function useAdminBaleho() {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => listAdminBaleho(signal),
  });
}

export function useBalehoMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  return {
    approve: useMutation({
      mutationFn: (id: string) => approveBaleho(id),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
        rejectBaleho(id, reason),
      onSuccess: invalidate,
    }),
    markPaid: useMutation({
      mutationFn: ({
        id,
        paymentProofUrl,
        paymentProofFileId,
      }: {
        id: string;
        paymentProofUrl: string;
        paymentProofFileId: string;
      }) => markPaidBaleho(id, { paymentProofUrl, paymentProofFileId }),
      onSuccess: invalidate,
    }),
    pause: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
        pauseBaleho(id, reason),
      onSuccess: invalidate,
    }),
    resume: useMutation({
      mutationFn: (id: string) => resumeBaleho(id),
      onSuccess: invalidate,
    }),
  };
}
