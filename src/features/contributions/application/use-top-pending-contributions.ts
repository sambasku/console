import { useQuery } from '@tanstack/react-query';
import { listContributionsRequest } from '../infrastructure/contribution-api';
import type { ContributionListItem } from '../domain/contribution';

/**
 * 5 kontribusi pending teratas untuk widget Analitik.
 * Query key berbagi prefix `contributions` agar invalidate review ikut segar.
 */
export function useTopPendingContributions(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['contributions', 'top-pending', { limit }],
    queryFn: async ({ signal }): Promise<ContributionListItem[]> => {
      const page = await listContributionsRequest(
        { status: 'pending', limit },
        signal,
      );
      return page.data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}
