import { useQuery } from '@tanstack/react-query';
import { getDiscussionDetailRequest } from '../infrastructure/discussion-api';
import type { DiscussionDetail } from '../domain/discussion';

export function useDiscussionDetail(id: string | undefined) {
  return useQuery<DiscussionDetail, Error>({
    queryKey: ['discussions', 'detail', id],
    queryFn: ({ signal }) => getDiscussionDetailRequest(id!, signal),
    enabled: !!id,
    staleTime: 30_000,
  });
}
