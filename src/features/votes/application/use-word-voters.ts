import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/shared/auth/use-auth';
import type { ApiError } from '@/shared/api/error';
import { getNextCursor } from '@/shared/utils/cursor';
import { listWordVotersRequest } from '../infrastructure/word-voters-api';
import {
  normalizeWordVoter,
  type WordVoterListItem,
} from '../domain/word-voters';
import { isVoteCountsReader } from './use-vote-counts';

const PAGE_LIMIT = 20;

export interface UseWordVotersArgs {
  wordId: string;
  meaningId?: string;
  value?: 1 | -1;
  enabled?: boolean;
}

/**
 * List voter makna satu kata (admin). Query key mengandung SEMUA filter.
 */
export function useWordVoters(args: UseWordVotersArgs) {
  const { wordId, meaningId, value, enabled = true } = args;
  const { user } = useAuth();
  const canRead = isVoteCountsReader(user?.role);

  const query = useInfiniteQuery<
    {
      data: WordVoterListItem[];
      meta: {
        limit: number;
        next_cursor: string | null;
        has_more: boolean;
        upvotes: number;
        downvotes: number;
      };
    },
    ApiError
  >({
    queryKey: ['admin-word-voters', { wordId, meaningId, value }],
    queryFn: async ({ pageParam, signal }) => {
      const page = await listWordVotersRequest(
        {
          wordId,
          meaningId,
          value,
          limit: PAGE_LIMIT,
          cursor: pageParam as string | undefined,
        },
        signal,
      );
      return {
        data: page.data.map(normalizeWordVoter),
        meta: page.meta,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextCursor(lastPage.meta),
    enabled: enabled && canRead && Boolean(wordId),
    staleTime: 30_000,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const totals = query.data?.pages[0]?.meta
    ? {
        upvotes: query.data.pages[0].meta.upvotes,
        downvotes: query.data.pages[0].meta.downvotes,
      }
    : null;

  return {
    items,
    totals,
    hasMore: Boolean(query.hasNextPage),
    loadMore: query.fetchNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}
