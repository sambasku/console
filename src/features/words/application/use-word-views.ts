import { useQuery } from '@tanstack/react-query';

import { getWordViewsReportRequest } from '../infrastructure/word-api';

/** Laporan tren + ranking halaman analitik kata. */
export function useWordViewsReport(days: number) {
  return useQuery({
    queryKey: ['words', 'views', 'report', days],
    queryFn: ({ signal }) => getWordViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}