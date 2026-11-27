import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveLemmaMergeRequest,
  getLemmaMergeDetailRequest,
  rejectLemmaMergeRequest,
} from '../infrastructure/lemma-merge-api';

export function useLemmaMergeDetail(id: string) {
  return useQuery({
    queryKey: ['lemma-merges', id],
    queryFn: ({ signal }) => getLemmaMergeDetailRequest(id, signal),
    enabled: !!id,
  });
}

export function useApproveLemmaMerge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewNote }: { id: string; reviewNote?: string }) =>
      approveLemmaMergeRequest(id, reviewNote),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lemma-merges'] });
    },
  });
}

export function useRejectLemmaMerge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewNote }: { id: string; reviewNote?: string }) =>
      rejectLemmaMergeRequest(id, reviewNote),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lemma-merges'] });
    },
  });
}