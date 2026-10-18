import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { RangeQuery } from '@/features/fcm-analytics/domain/fcm-analytics';
import type { MobileReport, MobileSection, MobileSectionData } from '../domain/mobile-analytics';
import { getMobileAnalyticsRequest } from '../infrastructure/mobile-analytics-api';

/**
 * Satu request per tab. API men-cache hasil Google 1 jam, staleTime 5 mnt
 * cukup untuk pindah tab bolak-balik tanpa hit ulang.
 */
export function useMobileAnalytics<S extends MobileSection>(section: S, query: RangeQuery) {
  return useQuery<MobileReport<MobileSectionData[S]>>({
    queryKey: ['mobile-analytics', section, query.range, query.start ?? null, query.end ?? null],
    queryFn: ({ signal }) => getMobileAnalyticsRequest(section, query, signal),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}
