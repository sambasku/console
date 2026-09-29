import { useCursorList } from '@/shared/hooks/use-cursor-list';
import { listDiscussionsRequest } from '../infrastructure/discussion-api';
import type { DiscussionListItem, DiscussionStatus } from '../domain/discussion';

const PAGE_LIMIT = 20;

export function useDiscussionList(
  args: { status?: DiscussionStatus; enabled?: boolean } = {},
) {
  const { status, enabled } = args;
  return useCursorList<DiscussionListItem>({
    queryKey: ['discussions', { status }],
    fetcher: (pageParam, signal) =>
      listDiscussionsRequest({ status, limit: PAGE_LIMIT, cursor: pageParam }, signal),
    enabled,
  });
}
