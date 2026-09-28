import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReviewDecisionResult } from '../domain/contribution';
import { reopenContributionRequest } from '../infrastructure/contribution-api';

/** Buka ulang keputusan review - invalidate list + detail. */
export function useReopenContribution() {
  const queryClient = useQueryClient();
  return useMutation<ReviewDecisionResult, Error, string>({
    mutationFn: (id) => reopenContributionRequest(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['contributions', 'detail', id] });
    },
  });
}
