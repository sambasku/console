import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PlayReport, PlaySection, RangeQuery } from '../domain/play-analytics';
import {
  getPlayAnalyticsRequest,
  type PlaySectionData,
} from '../infrastructure/play-analytics-api';

/**
 * Satu request per tab. API men-cache hasil GCS 6 jam, staleTime 5 mnt
 * cukup untuk pindah tab bolak-balik tanpa hit ulang.
 */
export function usePlayAnalytics<S extends PlaySection>(
  section: S,
  query: RangeQuery,
) {
  return useQuery<PlayReport<PlaySectionData[S]>>({
    queryKey: ['play-analytics', section, query.range, query.start ?? null, query.end ?? null],
    queryFn: ({ signal }) => getPlayAnalyticsRequest(section, query, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
