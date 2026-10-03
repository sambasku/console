import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { PlayReport, PlaySection, RangeQuery } from '../domain/play-analytics';

export async function getPlayAnalyticsRequest(
  section: PlaySection,
  query: RangeQuery,
  signal?: AbortSignal,
): Promise<PlayReport> {
  const res = await client.get<ApiOkEnvelope<PlayReport>>(`/admin/play-analytics/${section}`, {
    params: query,
    signal,
  });
  return res.data.data;
}
