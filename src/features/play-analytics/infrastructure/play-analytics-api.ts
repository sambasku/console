import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  PlayGrowth,
  PlayOverview,
  PlayReport,
  PlayRatings,
  PlaySection,
  RangeQuery,
} from '../domain/play-analytics';

/** Peta section -> bentuk data yang dijanjikan API untuk section itu. */
export interface PlaySectionData {
  overview: PlayOverview;
  growth: PlayGrowth;
  ratings: PlayRatings;
}

export async function getPlayAnalyticsRequest<S extends PlaySection>(
  section: S,
  query: RangeQuery,
  signal?: AbortSignal,
): Promise<PlayReport<PlaySectionData[S]>> {
  const res = await client.get<ApiOkEnvelope<PlayReport<PlaySectionData[S]>>>(
    `/admin/play-analytics/${section}`,
    {
      params: query,
      signal,
    },
  );
  return res.data.data;
}
