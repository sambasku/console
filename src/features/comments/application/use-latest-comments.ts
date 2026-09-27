import { useQuery } from '@tanstack/react-query';
import { listAdminCommentsRequest } from '../infrastructure/comment-api';
import type { AdminCommentItem } from '../domain/comment';

/**
 * 10 komentar terbaru (published) untuk widget Analitik.
 * Query key berbagi prefix `comments` agar invalidate moderasi ikut segar.
 */
export function useLatestComments(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['comments', 'latest', { limit }],
    queryFn: async ({ signal }): Promise<AdminCommentItem[]> => {
      const page = await listAdminCommentsRequest(
        { status: 'published', limit },
        signal,
      );
      return page.data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}
