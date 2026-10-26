import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  Usaha,
  UsahaCategoryRef,
  UsahaDuplicateCandidate,
  UsahaItem,
  UsahaKind,
  UsahaOperationalStatus,
  UsahaPublishStatus,
  UsahaVillageRef,
} from '../domain/usaha';

/** Wire payload dari API - snake_case, tanpa transformasi. */
export interface UsahaWire {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category: UsahaCategoryRef | null;
  kind: UsahaKind;
  region_id: string | null;
  village_id: string | null;
  village: UsahaVillageRef | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  social_url: string | null;
  cover_url: string | null;
  publish_status: UsahaPublishStatus;
  operational_status: UsahaOperationalStatus;
  restricted_reason: string | null;
  restricted_at: string | null;
  manager_id: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  items?: Array<{
    id: string;
    name: string;
    description: string | null;
    price_text: string | null;
    image_url: string | null;
    sort_order: number;
  }>;
}

export function mapUsaha(w: UsahaWire): Usaha {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    description: w.description,
    categoryId: w.category_id,
    category: w.category,
    kind: w.kind,
    regionId: w.region_id,
    villageId: w.village_id,
    village: w.village,
    addressText: w.address_text,
    lat: w.lat,
    lng: w.lng,
    mapsUrl: w.maps_url,
    phone: w.phone,
    whatsapp: w.whatsapp,
    website: w.website,
    socialUrl: w.social_url,
    coverUrl: w.cover_url,
    publishStatus: w.publish_status,
    operationalStatus: w.operational_status,
    restrictedReason: w.restricted_reason,
    restrictedAt: w.restricted_at,
    managerId: w.manager_id,
    authorId: w.author_id,
    publishedAt: w.published_at,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    items: (w.items ?? []).map(
      (it): UsahaItem => ({
        id: it.id,
        name: it.name,
        description: it.description,
        priceText: it.price_text,
        imageUrl: it.image_url,
        sortOrder: it.sort_order,
      }),
    ),
  };
}

export interface UsahaListParams {
  limit?: number;
  before?: string;
  q?: string;
  category_id?: string;
  region_id?: string;
  village_id?: string;
  kind?: UsahaKind;
  operational_status?: UsahaOperationalStatus;
  status?: UsahaPublishStatus;
}

export async function listUsahaRequest(
  params: UsahaListParams = {},
  signal?: AbortSignal,
): Promise<{ items: Usaha[]; nextCursor: string | null }> {
  const res = await client.get<{
    success: true;
    data: { items: UsahaWire[]; next_cursor: string | null };
  }>('/admin/usaha', { params, signal });
  return {
    items: res.data.data.items.map(mapUsaha),
    nextCursor: res.data.data.next_cursor,
  };
}

/** Katalog kategori untuk filter + form. */
export async function listUsahaCategoriesRequest(
  signal?: AbortSignal,
): Promise<UsahaCategoryRef[]> {
  const res = await client.get<{
    success: true;
    data: { items: UsahaCategoryRef[] };
  }>('/admin/usaha/categories', { signal });
  return res.data.data.items;
}

export interface UsahaInput {
  slug: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  kind?: UsahaKind;
  region_id: string;
  village_id?: string | null;
  address_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  social_url?: string | null;
  cover_url?: string | null;
  publish_status?: UsahaPublishStatus;
  operational_status?: UsahaOperationalStatus;
}

export async function createUsahaRequest(body: UsahaInput): Promise<Usaha> {
  const res = await client.post<ApiOkEnvelope<UsahaWire>>('/admin/usaha', body);
  return mapUsaha(res.data.data);
}

export async function updateUsahaRequest(
  id: string,
  body: Partial<UsahaInput>,
): Promise<Usaha> {
  const res = await client.patch<ApiOkEnvelope<UsahaWire>>(
    `/admin/usaha/${id}`,
    body,
  );
  return mapUsaha(res.data.data);
}

export async function deleteUsahaRequest(id: string): Promise<void> {
  await client.delete(`/admin/usaha/${id}`);
}

export async function restrictUsahaRequest(
  id: string,
  reason: string,
): Promise<Usaha> {
  const res = await client.post<ApiOkEnvelope<UsahaWire>>(
    `/admin/usaha/${id}/restrict`,
    { reason },
  );
  return mapUsaha(res.data.data);
}

export async function restoreUsahaRequest(id: string): Promise<Usaha> {
  const res = await client.post<ApiOkEnvelope<UsahaWire>>(
    `/admin/usaha/${id}/restore`,
  );
  return mapUsaha(res.data.data);
}

export async function listUsahaDuplicatesRequest(
  id: string,
  signal?: AbortSignal,
): Promise<UsahaDuplicateCandidate[]> {
  const res = await client.get<{
    success: true;
    data: { items: UsahaDuplicateCandidate[] };
  }>(`/admin/usaha/${id}/duplicates`, { signal });
  return res.data.data.items;
}

/** Upload foto usaha ke POST /images?purpose=usaha (kompres 720px WebP). */
export async function uploadUsahaImage(file: File): Promise<string> {
  const { compressImageForUpload } = await import('@/shared/utils/compress-image');
  const compressed = await compressImageForUpload(file);
  if (compressed.size > 5 * 1024 * 1024) {
    throw new Error('Gambar masih terlalu besar setelah dikompresi (maks 5 MB)');
  }
  const form = new FormData();
  form.append('file', compressed);
  const res = await client.post<ApiOkEnvelope<{ url: string }>>(
    '/images?purpose=usaha',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data.url;
}
