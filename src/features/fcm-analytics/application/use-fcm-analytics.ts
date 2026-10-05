import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { FcmReport, FcmSection, RangeQuery } from '../domain/fcm-analytics';
import { getFcmAnalyticsRequest, type FcmSectionData } from '../infrastructure/fcm-analytics-api';

/**
 * Satu request per tab. API men-cache hasil Google 1 jam, staleTime 5 mnt
 * cukup untuk pindah tab bolak-balik tanpa hit ulang.
 */
export function useFcmAnalytics<S extends FcmSection>(section: S, query: RangeQuery) {
  return useQuery<FcmReport<FcmSectionData[S]>>({
    queryKey: ['fcm-analytics', section, query.range, query.start ?? null, query.end ?? null],
    queryFn: ({ signal }) => getFcmAnalyticsRequest(section, query, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
