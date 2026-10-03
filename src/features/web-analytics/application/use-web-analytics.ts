import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { RangeQuery, SectionReportMap, WebAnalyticsSection } from '../domain/web-analytics';
import { getWebAnalyticsRequest } from '../infrastructure/web-analytics-api';

/**
 * Satu request per tab. API sudah meng-cache hasil Google (GA4 30 mnt,
 * Search Console 6 jam), jadi staleTime 5 mnt cukup untuk pindah tab
 * bolak-balik tanpa hit ulang.
 */
export function useWebAnalytics<S extends WebAnalyticsSection>(section: S, query: RangeQuery) {
  return useQuery<SectionReportMap[S]>({
    queryKey: ['web-analytics', section, query.range, query.start ?? null, query.end ?? null],
    queryFn: ({ signal }) => getWebAnalyticsRequest(section, query, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
