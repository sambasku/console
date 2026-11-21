import { useQuery } from '@tanstack/react-query';
import { getCuisineViewsReportRequest, listCuisineViewsRequest } from '../infrastructure/culinary-api';

export function useCuisineViews(days?: number) {
  return useQuery({
    queryKey: ['culinary', 'views', days ?? 'all'],
    queryFn: ({ signal }) => listCuisineViewsRequest(days, signal),
    staleTime: 60_000,
  });
}

export function useCuisineViewsReport(days: number) {
  return useQuery({
    queryKey: ['culinary', 'views', 'report', days],
    queryFn: ({ signal }) => getCuisineViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}