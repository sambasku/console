import { useQuery } from '@tanstack/react-query';
import {
  getLayananViewsReportRequest,
  listLayananViewsRequest,
} from '../infrastructure/layanan-api';

export function useLayananViews(days?: number) {
  return useQuery({
    queryKey: ['layanan', 'views', days ?? 'all'],
    queryFn: ({ signal }) => listLayananViewsRequest(days, signal),
    staleTime: 60_000,
  });
}

export function useLayananViewsReport(days: number) {
  return useQuery({
    queryKey: ['layanan', 'views', 'report', days],
    queryFn: ({ signal }) => getLayananViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}