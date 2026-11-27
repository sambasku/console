import { useQuery } from '@tanstack/react-query';
import { getKaryaViewsReportRequest, listKaryaViewsRequest } from '../infrastructure/karya-api';

export function useKaryaViews(days?: number) {
  return useQuery({
    queryKey: ['karya', 'views', days ?? 'all'],
    queryFn: ({ signal }) => listKaryaViewsRequest(days, signal),
    staleTime: 60_000,
  });
}

export function useKaryaViewsReport(days: number) {
  return useQuery({
    queryKey: ['karya', 'views', 'report', days],
    queryFn: ({ signal }) => getKaryaViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}