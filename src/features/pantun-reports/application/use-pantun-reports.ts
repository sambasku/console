import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listPantunReportsRequest,
  resolvePantunReportRequest,
  type PantunReportResolution,
  type PantunReportStatus,
} from '../infrastructure/pantun-report-api';

export function usePantunReports(params: { status?: PantunReportStatus }) {
  return useQuery({
    queryKey: ['pantun-reports', params],
    queryFn: ({ signal }) => listPantunReportsRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useResolvePantunReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      resolution: PantunReportResolution;
      note?: string | null;
    }) => {
      const { id, ...body } = params;
      return resolvePantunReportRequest(id, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pantun-reports'] });
      void qc.invalidateQueries({ queryKey: ['pantuns'] });
    },
  });
}
