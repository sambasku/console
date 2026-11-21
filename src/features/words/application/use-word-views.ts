import { useQuery } from '@tanstack/react-query';

import {
  getWordViewSeriesRequest,
  getWordViewsReportRequest,
} from '../infrastructure/word-api';

/** Laporan tren + ranking halaman analitik kata. */
export function useWordViewsReport(days: number) {
  return useQuery({
    queryKey: ['words', 'views', 'report', days],
    queryFn: ({ signal }) => getWordViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}

/** Tren pembaca unik satu lemma (halaman detail). */
export function useWordViewSeries(wordId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['words', 'views', 'series', wordId, days],
    queryFn: ({ signal }) => getWordViewSeriesRequest(wordId!, days, signal),
    enabled: Boolean(wordId),
    staleTime: 60_000,
  });
}