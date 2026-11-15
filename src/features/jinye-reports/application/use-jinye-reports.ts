import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listJinyeReportsRequest,
  resolveJinyeReportRequest,
  type JinyeReportResolution,
  type JinyeReportStatus,
} from '../infrastructure/jinye-report-api';

export function useJinyeReports(params: { status?: JinyeReportStatus }) {
  return useQuery({
    queryKey: ['jinye-reports', params],
    queryFn: ({ signal }) => listJinyeReportsRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useResolveJinyeReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      resolution: JinyeReportResolution;
      note?: string | null;
    }) => {
      const { id, ...body } = params;
      return resolveJinyeReportRequest(id, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['jinye-reports'] });
      void qc.invalidateQueries({ queryKey: ['jinye'] });
    },
  });
}
