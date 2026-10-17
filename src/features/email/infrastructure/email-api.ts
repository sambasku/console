import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { EmailLog, EmailLogStatus, EmailQuota } from '../domain/email';

export async function listEmailLogsRequest(
  params: { cursor?: string; limit?: number; status?: EmailLogStatus },
  signal?: AbortSignal,
): Promise<{ logs: EmailLog[]; next_cursor: string | null }> {
  const res = await client.get<ApiOkEnvelope<{ logs: EmailLog[]; next_cursor: string | null }>>(
    '/admin/email/logs',
    { params: { cursor: params.cursor, limit: params.limit ?? 20, status: params.status }, signal },
  );
  return res.data.data;
}

export async function listEmailQuotasRequest(signal?: AbortSignal): Promise<EmailQuota[]> {
  const res = await client.get<ApiOkEnvelope<{ quotas: EmailQuota[] }>>('/admin/email/quotas', {
    signal,
  });
  return res.data.data.quotas;
}
