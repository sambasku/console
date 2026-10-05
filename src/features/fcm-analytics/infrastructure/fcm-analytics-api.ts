import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  FcmDelivery,
  FcmEngagement,
  FcmReport,
  FcmSection,
  RangeQuery,
} from '../domain/fcm-analytics';

/** Peta section -> bentuk data yang dijanjikan API untuk section itu. */
export interface FcmSectionData {
  delivery: FcmDelivery;
  engagement: FcmEngagement;
}

export async function getFcmAnalyticsRequest<S extends FcmSection>(
  section: S,
  query: RangeQuery,
  signal?: AbortSignal,
): Promise<FcmReport<FcmSectionData[S]>> {
  const res = await client.get<ApiOkEnvelope<FcmReport<FcmSectionData[S]>>>(
    `/admin/fcm-analytics/${section}`,
    {
      params: query,
      signal,
    },
  );
  return res.data.data;
}
