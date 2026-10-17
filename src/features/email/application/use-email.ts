import { useQuery } from '@tanstack/react-query';
import { listEmailLogsRequest, listEmailQuotasRequest } from '../infrastructure/email-api';
import type { EmailLogStatus } from '../domain/email';

export function useEmailLogs(enabled: boolean, status?: EmailLogStatus) {
  return useQuery({
    queryKey: ['admin-email-logs', status ?? 'all'],
    queryFn: ({ signal }) => listEmailLogsRequest({ limit: 50, status }, signal),
    enabled,
  });
}

export function useEmailQuotas(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-email-quotas'],
    queryFn: ({ signal }) => listEmailQuotasRequest(signal),
    enabled,
  });
}
