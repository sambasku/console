import { useQuery } from '@tanstack/react-query';
import {
  getArticleViewsReportRequest,
  listArticleViewsRequest,
} from '../infrastructure/encyclopedia-api';

/** Total view per artikel untuk kolom "Dilihat" (undefined days = semua). */
export function useArticleViews(days?: number, enabled = true) {
  return useQuery({
    queryKey: ['encyclopedia', 'views', days ?? 'all'],
    queryFn: ({ signal }) => listArticleViewsRequest(days, signal),
    staleTime: 60_000,
    enabled,
  });
}

export function useArticleViewsReport(days: number, enabled = true) {
  return useQuery({
    queryKey: ['encyclopedia', 'views', 'report', days],
    queryFn: ({ signal }) => getArticleViewsReportRequest(days, signal),
    staleTime: 60_000,
    enabled,
  });
}