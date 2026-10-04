import { useQuery } from '@tanstack/react-query';
import { normalizeDashboardStats } from './dashboard-mappers';
import type { DashboardStats } from '../domain/dashboard-stats';
import { getDashboardStatsRequest } from '../infrastructure/dashboard-api';

/**
 * Statistik dashboard (GET /api/v1/admin/dashboard/stats).
 * staleTime 5 mnt - agregat jarang berubah; refresh lewat tombol reload.
 */
export function useDashboardStats(options: { enabled?: boolean } = {}): ReturnType<typeof useQuery<DashboardStats>> {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async ({ signal }) => normalizeDashboardStats(await getDashboardStatsRequest(signal)),
    staleTime: 5 * 60_000,
    enabled: options.enabled,
  });
}