import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getWaUsageRequest,
  listWaLogsRequest,
  listWaTemplatesRequest,
  testSendWaRequest,
  updateWaTemplateRequest,
  updateWaUsageRequest,
} from '../infrastructure/wa-api';

export function useWaTemplates(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-wa-templates'],
    queryFn: ({ signal }) => listWaTemplatesRequest(signal),
    enabled,
  });
}

export function useWaUsage(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-wa-usage'],
    queryFn: ({ signal }) => getWaUsageRequest(signal),
    enabled,
  });
}

export function useWaLogs(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-wa-logs'],
    queryFn: ({ signal }) => listWaLogsRequest({ limit: 20 }, signal),
    enabled,
  });
}

export function useWaMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-wa-templates'] });
    void qc.invalidateQueries({ queryKey: ['admin-wa-usage'] });
    void qc.invalidateQueries({ queryKey: ['admin-wa-logs'] });
  };

  return {
    updateTemplate: useMutation({
      mutationFn: ({
        id,
        ...body
      }: {
        id: string;
        enabled?: boolean;
        meta_template_name?: string;
        meta_template_language?: string;
        body?: string;
      }) => updateWaTemplateRequest(id, body),
      onSuccess: invalidate,
    }),
    updateUsage: useMutation({
      mutationFn: updateWaUsageRequest,
      onSuccess: invalidate,
    }),
    testSend: useMutation({
      mutationFn: testSendWaRequest,
      onSuccess: invalidate,
    }),
  };
}
