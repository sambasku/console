import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { WaLog, WaTemplate, WaTemplateParam, WaTestSendResult, WaUsage } from '../domain/wa';

export async function listWaTemplatesRequest(signal?: AbortSignal): Promise<WaTemplate[]> {
  const res = await client.get<ApiOkEnvelope<{ templates: WaTemplate[] }>>('/admin/wa/templates', {
    signal,
  });
  return res.data.data.templates;
}

export async function updateWaTemplateRequest(
  id: string,
  body: {
    enabled?: boolean;
    meta_template_name?: string;
    meta_template_language?: string;
    body?: string;
  },
): Promise<WaTemplate> {
  const res = await client.patch<ApiOkEnvelope<{ template: WaTemplate }>>(
    `/admin/wa/templates/${id}`,
    body,
  );
  return res.data.data.template;
}

export async function createWaTemplateRequest(body: {
  event_key: string;
  meta_template_name: string;
  meta_template_language?: string;
  body: string;
  params?: WaTemplateParam[];
  enabled?: boolean;
}): Promise<WaTemplate> {
  const res = await client.post<ApiOkEnvelope<{ template: WaTemplate }>>('/admin/wa/templates', body);
  return res.data.data.template;
}

export async function getWaUsageRequest(signal?: AbortSignal): Promise<WaUsage> {
  const res = await client.get<ApiOkEnvelope<{ usage: WaUsage }>>('/admin/wa/usage', { signal });
  return res.data.data.usage;
}

export async function updateWaUsageRequest(body: {
  used_count?: number;
  limit_count?: number;
  warn_threshold_percent?: number;
}): Promise<WaUsage> {
  const res = await client.patch<ApiOkEnvelope<{ usage: WaUsage }>>('/admin/wa/usage', body);
  return res.data.data.usage;
}

export async function listWaLogsRequest(
  params: { cursor?: string; limit?: number },
  signal?: AbortSignal,
): Promise<{ logs: WaLog[]; next_cursor: string | null }> {
  const res = await client.get<ApiOkEnvelope<{ logs: WaLog[]; next_cursor: string | null }>>(
    '/admin/wa/logs',
    { params: { cursor: params.cursor, limit: params.limit ?? 20 }, signal },
  );
  return res.data.data;
}

export async function testSendWaRequest(body: {
  phone: string;
  template_id: string;
}): Promise<WaTestSendResult> {
  const res = await client.post<ApiOkEnvelope<WaTestSendResult>>('/admin/wa/test-send', body);
  return res.data.data;
}
