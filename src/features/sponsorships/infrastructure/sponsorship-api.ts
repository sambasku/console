import { client } from '@/shared/api/client';
import type { ApiCursorPageEnvelope } from '@/shared/api/types';
import type { Sponsorship, SponsorshipInput } from '../domain/sponsorship';

interface SponsorshipWire {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  url: string | null;
  username: string | null;
  since: string;
  note: string;
  created_at: string;
  updated_at: string | null;
}

function toDomain(w: SponsorshipWire): Sponsorship {
  return {
    id: w.id,
    userId: w.user_id,
    name: w.name,
    description: w.description,
    logoUrl: w.logo_url,
    url: w.url,
    username: w.username,
    since: w.since,
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
