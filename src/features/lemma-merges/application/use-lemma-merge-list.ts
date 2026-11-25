import { useCursorList } from '@/shared/hooks/use-cursor-list';
import { listLemmaMergesRequest } from '../infrastructure/lemma-merge-api';
import type { LemmaMergeListItem, LemmaMergeStatus } from '../domain/lemma-merge';

export function useLemmaMergeList(args: { status?: LemmaMergeStatus; enabled?: boolean } = {}) {
  const { status, enabled } = args;
  return useCursorList<LemmaMergeListItem>({
    queryKey: ['lemma-merges', { status }],
    fetcher: (pageParam, signal) =>
      listLemmaMergesRequest({ status, limit: 20, cursor: pageParam }, signal),
    enabled,
  });
}