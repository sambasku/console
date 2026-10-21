import { client } from '@/shared/api/client';
import type { Region, RegionStatus, RegionType } from '../domain/region';

interface RegionWire {
  id: string;
  slug: string;
  name: string;
  type: RegionType;
  parent_id: string | null;
  code: string | null;
  lat: number | null;
  lng: number | null;
  status: RegionStatus;
  sort_order: number;
  created_at: number;
  updated_at: number | null;
}

function mapRegion(w: RegionWire): Region {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    type: w.type,
    parentId: w.parent_id,
    code: w.code,
    lat: w.lat,
    lng: w.lng,
    status: w.status,
    sortOrder: w.sort_order,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export interface RegionListResult {
  items: Region[];
  nextCursor: string | null;
}

export async function listRegionsRequest(
  params: {
    limit?: number;
    before?: string;
    type?: RegionType;
    parent_id?: string;
    q?: string;
    status?: RegionStatus;
  } = {},
  signal?: AbortSignal,
): Promise<RegionListResult> {
  const res = await client.get<{
    success: true;
    data: { items: RegionWire[]; next_cursor: string | null };
  }>('/admin/regions', { params, signal });
  return {
    items: res.data.data.items.map(mapRegion),
    nextCursor: res.data.data.next_cursor,
  };
}

/** Ambil semua halaman (katalog kecil ≈214). */
export async function listAllRegionsRequest(
  params: { type?: RegionType; parent_id?: string; status?: RegionStatus } = {},
  signal?: AbortSignal,
): Promise<Region[]> {
  const items: Region[] = [];
  const seen = new Set<string>();
  let before: string | undefined;
  for (let page = 0; page < 5; page++) {
    const batch = await listRegionsRequest({ ...params, limit: 500, before }, signal);
    let added = 0;
    for (const item of batch.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
      added++;
    }
    if (!batch.nextCursor || added === 0) break;
    before = batch.nextCursor;
  }
  return items;
}

export type RegionInput = {
  slug: string;
  name: string;
  type: RegionType;
  parent_id?: string | null;
  code?: string | null;
  lat?: number | null;
  lng?: number | null;
  status?: RegionStatus;
  sort_order?: number;
};

export async function createRegionRequest(body: RegionInput): Promise<Region> {
  const res = await client.post<{ success: true; data: RegionWire }>('/admin/regions', body);
  return mapRegion(res.data.data);
}

export async function updateRegionRequest(
  id: string,
  body: Partial<Omit<RegionInput, 'slug' | 'type'>>,
): Promise<Region> {
  const res = await client.patch<{ success: true; data: RegionWire }>(
    '/admin/regions/by-id',
    body,
    { params: { id } },
  );
  return mapRegion(res.data.data);
}

export async function deleteRegionRequest(id: string): Promise<void> {
  await client.delete(`/admin/regions/by-id`, { params: { id } });
}
