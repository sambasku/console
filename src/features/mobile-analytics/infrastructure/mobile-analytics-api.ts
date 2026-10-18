import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { RangeQuery } from '@/features/fcm-analytics/domain/fcm-analytics';
import type { MobileReport, MobileSection, MobileSectionData } from '../domain/mobile-analytics';

export async function getMobileAnalyticsRequest<S extends MobileSection>(
  section: S,
  query: RangeQuery,
  signal?: AbortSignal,
): Promise<MobileReport<MobileSectionData[S]>> {
  const res = await client.get<ApiOkEnvelope<MobileReport<MobileSectionData[S]>>>(
    `/admin/mobile-analytics/${section}`,
    { params: query, signal },
  );
  return res.data.data;
}
