import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { RangeQuery, SectionReportMap, WebAnalyticsSection } from '../domain/web-analytics';

export async function getWebAnalyticsRequest<S extends WebAnalyticsSection>(
  section: S,
  query: RangeQuery,
  signal?: AbortSignal,
): Promise<SectionReportMap[S]> {
  const res = await client.get<ApiOkEnvelope<SectionReportMap[S]>>(`/admin/web-analytics/${section}`, {
    params: query,
    signal,
  });
  return res.data.data;
}
