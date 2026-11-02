import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { MobileRelease, MobileReleasePlatform } from '../domain/mobile-release';

type WireMobileRelease = {
  id: string;
  platform: MobileReleasePlatform;
  version: string;
  store_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

function mapRelease(w: WireMobileRelease): MobileRelease {
  return {
    id: w.id,
    platform: w.platform,
    version: w.version,
    storeUrl: w.store_url,
    notes: w.notes,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export async function listMobileReleasesRequest(signal?: AbortSignal): Promise<MobileRelease[]> {
  const res = await client.get<ApiOkEnvelope<WireMobileRelease[]>>(
    '/admin/mobile-release',
    { signal },
  );
  return (res.data.data ?? []).map(mapRelease);
}

export async function upsertMobileReleaseRequest(
  platform: MobileReleasePlatform,
  data: { version: string; store_url?: string | null; notes?: string | null },
  signal?: AbortSignal,
): Promise<MobileRelease> {
  const res = await client.put<ApiOkEnvelope<WireMobileRelease>>(
    `/admin/mobile-release/${platform}`,
    data,
    { signal },
  );
  return mapRelease(res.data.data);
}
