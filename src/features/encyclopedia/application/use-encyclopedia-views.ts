import { useQuery } from '@tanstack/react-query';
import {
  getArticleViewsReportRequest,
  listArticleViewsRequest,
} from '../infrastructure/encyclopedia-api';

export function useArticleViews(days?: number) {
  return useQuery({
    queryKey: ['encyclopedia', 'views', days ?? 'all'],
    queryFn: ({ signal }) => listArticleViewsRequest(days, signal),
    staleTime: 60_000,
  });
}

export function useArticleViewsReport(days: number) {
  return useQuery({
    queryKey: ['encyclopedia', 'views', 'report', days],
    queryFn: ({ signal }) => getArticleViewsReportRequest(days, signal),
    staleTime: 60_000,
  });
}