import { useQuery } from '@tanstack/react-query';
import { getUsahaViewsReportRequest, listUsahaViewsRequest } from '../infrastructure/usaha-api';

export function useUsahaViews(days?: number) {
  return useQuery({
    queryKey: ['usaha', 'views', days ?? 'all'],
    queryFn: ({ signal }) => listUsahaViewsRequest(days, signal),
    staleTime: 60_000,
  });
}

export function useUsahaViewsReport(days: number) {
  return useQuery({
    queryKey: ['usaha', 'views', 'report', days],
    queryFn: ({ signal }) => getUsahaViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}