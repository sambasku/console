import { client } from '@/shared/api/client';

export type KaryaKind = 'music' | 'film';

export interface KaryaCreditWire {
  role: string;
  name_text: string;
  kreator_id?: string | null;
  sort_order?: number;
}

export interface SambasConnectionWire {
  type: 'creator_origin' | 'language' | 'location' | 'theme' | 'other';
  note: string;
}

export interface KaryaRelatedRefWire {
  kind:
    | 'place'
    | 'word'
    | 'article'
    | 'event'
    | 'usaha'
    | 'kreator'
    | 'karya';
  slug?: string | null;
  id?: string | null;
}

export interface AccessLinkWire {
  kind: 'listen' | 'watch' | 'buy' | 'read' | 'stream' | 'official' | 'other';
  label: string;
  url: string;
  is_primary?: boolean;
}

export interface KaryaWire {
  id: string;
  slug: string;
  title: string;
  kind: KaryaKind;
  year: number;
  language: string | null;
  description: string | null;
  cover_url: string | null;
  sambas_connections: SambasConnectionWire[];
  access_links: AccessLinkWire[];
  credits: KaryaCreditWire[];
  music_release_type?: string | null;
  music_is_cover?: boolean;
  film_type?: string | null;
  film_runtime_min?: number | null;
  publish_status: 'draft' | 'published' | 'archived' | 'restricted';
  author_id?: string | null;
  author_username?: string | null;
  related_refs?: KaryaRelatedRefWire[];
  updated_at: string;
}

export interface KaryaInput {
  title: string;
  year: number;
  kind: KaryaKind;
  language?: string | null;
  description?: string | null;
  cover_url?: string | null;
  sambas_connections: SambasConnectionWire[];
  access_links?: AccessLinkWire[];
  credits: KaryaCreditWire[];
  music_release_type?: string | null;
  music_is_cover?: boolean;
  film_type?: string | null;
  film_runtime_min?: number | null;
  related?: KaryaRelatedRefWire[];
}

export interface KaryaContributionWire {
  id: string;
  kind: 'new' | 'edit' | 'excerpt';
  status: string;
  username: string | null;
  karya_id: string | null;
  payload: Record<string, unknown>;
  revision_note: string | null;
}

export async function listAdminKarya(signal?: AbortSignal): Promise<KaryaWire[]> {
  const res = await client.get<{ success: true; data: { items: KaryaWire[] } }>(
    '/admin/karya',
    { signal },
  );
  return res.data.data.items;
}

export async function createAdminKarya(body: KaryaInput): Promise<KaryaWire> {
  const res = await client.post<{ success: true; data: KaryaWire }>('/admin/karya', body);
  return res.data.data;
}

export async function updateAdminKarya(id: string, body: KaryaInput): Promise<KaryaWire> {
  const res = await client.put<{ success: true; data: KaryaWire }>(`/admin/karya/${id}`, body);
  return res.data.data;
}

export async function setKaryaPublished(id: string, published: boolean): Promise<void> {
  const action = published ? 'publish' : 'unpublish';
  await client.post(`/admin/karya/${id}/${action}`);
}

export async function listKaryaQueue(signal?: AbortSignal): Promise<KaryaContributionWire[]> {
  const res = await client.get<{ success: true; data: { items: KaryaContributionWire[] } }>(
    '/admin/karya-contributions',
    { params: { status: 'pending' }, signal },
  );
  return res.data.data.items;
}

export async function approveKaryaContribution(id: string): Promise<void> {
  await client.post(`/admin/karya-contributions/${id}/approve`);
}

export async function rejectKaryaContribution(id: string): Promise<void> {
  await client.post(`/admin/karya-contributions/${id}/reject`, { reason_code: 'other' });
}

export async function reviseKaryaContribution(id: string, note: string): Promise<void> {
  await client.post(`/admin/karya-contributions/${id}/request-revision`, { note });
}

export async function linkKaryaCredit(
  creditId: string,
  body: { kreator_id?: string; display_name?: string },
): Promise<void> {
  await client.post(`/admin/karya-credits/${creditId}/link`, body);
}
