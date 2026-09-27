import { useQuery } from '@tanstack/react-query';
import { listSearchMissesRequest } from '../infrastructure/search-miss-api';
import { normalizeSearchMissListItem } from './search-miss-mappers';
import type { SearchMissListItem } from '../domain/search-miss';

const CANDIDATE_LIMIT = 100;

/**
 * Top N search miss: belum terpenuhi, belum tayang, belum dismiss
 * (list admin otomatis exclude soft-delete). Sort hit_count di client
 * karena admin list default order by id.
 */
export function useTopPendingSearchMisses(limit = 10) {
  return useQuery({
    queryKey: ['search-misses', 'top-pending', { limit }],
    queryFn: async ({ signal }): Promise<SearchMissListItem[]> => {
      const page = await listSearchMissesRequest(
        { fulfilled: false, visible: false, limit: CANDIDATE_LIMIT },
        signal,
      );
      return page.data
        .map(normalizeSearchMissListItem)
        .sort((a, b) => b.searchCount - a.searchCount || b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },
    staleTime: 5 * 60_000,
  });
}
