import { client } from '@/shared/api/client';

export type LayananCategory = 'ambulance' | 'fire';

export interface LayananPhoneWire {
  phone: string;
  note: string | null;
  whatsapp: string | null;
}

export interface LayananWire {
  id: string;
  slug: string;
  category: LayananCategory;
  name: string;
  phones: LayananPhoneWire[];
  logo_url: string | null;
  address_text: string | null;
  region_id: string;
  region_name: string | null;
  note: string | null;
  publish_status: 'published' | 'unpublished';
  updated_at: string;
}

export interface LayananInput {
  category: LayananCategory;
  name: string;
  phones: LayananPhoneWire[];
  logo_url?: string | null;
  address_text?: string | null;
  region_id: string;
  note?: string | null;
}

export interface LayananContributionWire {
  id: string;
  kind: 'new' | 'edit';
  status: string;
  username: string | null;
  payload: LayananInput & {
    village_id?: string | null;
    lat?: number | null;
    lng?: number | null;
    maps_url?: string | null;
  };
  revision_note: string | null;
}

export async function listAdminLayanan(signal?: AbortSignal): Promise<LayananWire[]> {
  const res = await client.get<{ success: true; data: { items: LayananWire[] } }>(
    '/admin/layanan',
    { signal },
  );
  return res.data.data.items;
}

export async function createAdminLayanan(body: LayananInput): Promise<LayananWire> {
  const res = await client.post<{ success: true; data: LayananWire }>('/admin/layanan', body);
  return res.data.data;
}

export async function updateAdminLayanan(id: string, body: LayananInput): Promise<LayananWire> {
  const res = await client.put<{ success: true; data: LayananWire }>(`/admin/layanan/${id}`, body);
  return res.data.data;
}

export async function setLayananPublished(id: string, published: boolean): Promise<void> {
  const action = published ? 'publish' : 'unpublish';
  await client.post(`/admin/layanan/${id}/${action}`);
}

export async function listLayananQueue(signal?: AbortSignal): Promise<LayananContributionWire[]> {
  const res = await client.get<{ success: true; data: { items: LayananContributionWire[] } }>(
    '/admin/layanan-contributions',
    { params: { status: 'pending' }, signal },
  );
  return res.data.data.items;
}

export async function approveLayananContribution(id: string): Promise<void> {
  await client.post(`/admin/layanan-contributions/${id}/approve`);
}

export async function rejectLayananContribution(id: string): Promise<void> {
  await client.post(`/admin/layanan-contributions/${id}/reject`, { reason_code: 'other' });
}

export async function reviseLayananContribution(id: string, note: string): Promise<void> {
  await client.post(`/admin/layanan-contributions/${id}/request-revision`, { note });
}
