import { useCursorList } from '@/shared/hooks/use-cursor-list';
import type { AdminCommentItem, CommentImageStatus, CommentStatus } from '../domain/comment';
import { listAdminCommentsRequest } from '../infrastructure/comment-api';

const PAGE_LIMIT = 20;

export interface UseCommentListArgs {
  status?: CommentStatus;
  imageStatus?: CommentImageStatus;
  enabled?: boolean;
}

/** Antrean moderasi komentar - filter status / image_status + cursor pagination. */
export function useCommentList(args: UseCommentListArgs = {}) {
  const { status, imageStatus, enabled } = args;

  return useCursorList<AdminCommentItem>({
    queryKey: ['comments', { status, imageStatus }],
    fetcher: (pageParam, signal) =>
      listAdminCommentsRequest(
        { status, imageStatus, limit: PAGE_LIMIT, cursor: pageParam },
        signal,
      ),
    enabled,
  });
}