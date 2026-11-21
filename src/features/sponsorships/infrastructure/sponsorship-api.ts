import { client } from '@/shared/api/client';
import type { ApiCursorPageEnvelope } from '@/shared/api/types';
import type { Sponsorship, SponsorshipInput, SponsorshipTier } from '../domain/sponsorship';

interface SponsorshipWire {
  id: string;
  user_id: string | null;
  usaha_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  url: string | null;
  username: string | null;
  tier: SponsorshipTier;
  since: string;
  ends_on: string | null;
  note: string;
  created_at: string;
  updated_at: string | null;
}

function toDomain(w: SponsorshipWire): Sponsorship {
  return {
    id: w.id,
    userId: w.user_id,
    usahaId: w.usaha_id,
    name: w.name,
    description: w.description,
    logoUrl: w.logo_url,
    url: w.url,
    username: w.username,
    tier: w.tier ?? 'perak',
    since: w.since,
    endsOn: w.ends_on,
    note: w.note,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export async function listSponsorshipsRequest(params?: {
  limit?: number;
  cursor?: string;
}): Promise<{ items: Sponsorship[]; nextCursor: string | null; hasMore: boolean }> {
  const res = await client.get<ApiCursorPageEnvelope<SponsorshipWire>>('/admin/sponsorships', {
    params: { limit: params?.limit ?? 50, cursor: params?.cursor },
  });
  return {
    items: res.data.data.map(toDomain),
    nextCursor: res.data.meta.next_cursor,
    hasMore: res.data.meta.has_more,
  };
}

export async function createSponsorshipRequest(input: SponsorshipInput): Promise<Sponsorship> {
  const res = await client.post<{ success: true; data: SponsorshipWire }>(
    '/admin/sponsorships',
    input,
  );
  return toDomain(res.data.data);
}

export async function updateSponsorshipRequest(
  id: string,
  input: Partial<SponsorshipInput>,
): Promise<Sponsorship> {
  const res = await client.patch<{ success: true; data: SponsorshipWire }>(
    `/admin/sponsorships/${id}`,
    input,
  );
  return toDomain(res.data.data);
}

export async function deleteSponsorshipRequest(id: string): Promise<void> {
  await client.delete(`/admin/sponsorships/${id}`);
}

/**
 * Resize client-side + PNG (alpha aman) lalu unggah ke CDN ImageKit.
 * Folder `/sponsorships` - dipakai splash + halaman Komunitas nanti.
 */
export async function uploadSponsorshipLogo(file: File): Promise<string> {
  const { compressImageForUpload, SPONSOR_LOGO_MAX_HEIGHT, SPONSOR_LOGO_MAX_WIDTH } =
    await import('@/shared/utils/compress-image');
  const { uploadImageToCdn } = await import('@/shared/api/image-upload');

  const prepared = await compressImageForUpload(file, {
    maxWidth: SPONSOR_LOGO_MAX_WIDTH,
    maxHeight: SPONSOR_LOGO_MAX_HEIGHT,
    preserveAlpha: true,
  });
  if (prepared.size > 2 * 1024 * 1024) {
    throw new Error('Logo masih terlalu besar setelah diproses (maks 2 MB)');
  }
  const { url } = await uploadImageToCdn(prepared, '/sponsorships');
  return url;
}
