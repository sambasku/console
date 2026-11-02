import { client } from '@/shared/api/client';
import type { Place, PlaceCategory, PlaceRelation, PlaceStatus, PlaceType } from '../domain/place';

interface PlaceWire {
  id: string;
  slug: string;
  name: string;
  category: PlaceCategory;
  type: PlaceType | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  short_description: string;
  region_id: string | null;
  village_id: string | null;
  hours: string | null;
  contact: string | null;
  author_id: string | null;
  related?: Array<{ kind: 'place' | 'usaha'; slug: string }>;
  sources: Array<{
    name: string;
    type: string;
    address: string;
    license?: string | null;
    license_url?: string | null;
  }>;
  images: Array<{
    id: string;
    url: string;
    is_main: boolean;
    sort_order: number;
    attribution: {
      name: string;
      provider?: string;
      url?: string | null;
      license?: string | null;
      license_url?: string | null;
      source?: string | null;
      authorId?: string | null;
    } | null;
  }>;
  status: PlaceStatus;
  created_at: number;
  updated_at: number | null;
}

function mapPlace(w: PlaceWire): Place {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    category: w.category,
    type: w.type,
    lat: w.lat,
    lng: w.lng,
    mapsUrl: w.maps_url,
    shortDescription: w.short_description,
    regionId: w.region_id,
    villageId: w.village_id,
    hours: w.hours,
    contact: w.contact,
    authorId: w.author_id,
    related: (w.related ?? []).map((r) => ({ kind: r.kind, slug: r.slug })),
    sources: w.sources.map((s) => ({
      name: s.name,
      type: s.type,
      address: s.address,
      license: s.license ?? null,
      licenseUrl: s.license_url ?? null,
    })),
    images: w.images.map((img) => ({
      id: img.id,
      url: img.url,
      isMain: img.is_main,
      sortOrder: img.sort_order,
      attribution: img.attribution
        ? {
            name: img.attribution.name,
            provider: img.attribution.provider,
            url: img.attribution.url,
            license: img.attribution.license,
            licenseUrl: img.attribution.license_url,
            source: img.attribution.source,
            authorId: img.attribution.authorId,
          }
        : null,
    })),
    status: w.status,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export interface PlaceListResult {
  items: Place[];
  nextCursor: string | null;
}

export async function listPlacesRequest(
  params: {
    limit?: number;
    before?: string;
    category?: PlaceCategory;
    region_id?: string;
    q?: string;
    status?: PlaceStatus;
  } = {},
  signal?: AbortSignal,
): Promise<PlaceListResult> {
  const res = await client.get<{
    success: true;
    data: { items: PlaceWire[]; next_cursor: string | null };
  }>('/admin/places', { params, signal });
  return {
    items: res.data.data.items.map(mapPlace),
    nextCursor: res.data.data.next_cursor,
  };
}

export type PlaceInput = {
  slug: string;
  name: string;
  category: PlaceCategory;
  type?: PlaceType | null;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  short_description: string;
  region_id?: string | null;
  village_id?: string | null;
  hours?: string | null;
  contact?: string | null;
  author_id?: string | null;
  related?: PlaceRelation[];
  sources?: Array<{
    name: string;
    type: string;
    address: string;
    license?: string | null;
    license_url?: string | null;
  }>;
  images?: Array<{
    url: string;
    is_main?: boolean;
    sort_order?: number;
    attribution?: {
      name: string;
      provider?: string;
      url?: string | null;
      license?: string | null;
      license_url?: string | null;
      source?: string | null;
      authorId?: string | null;
    } | null;
  }>;
  status?: PlaceStatus;
};

export async function createPlaceRequest(body: PlaceInput): Promise<Place> {
  const res = await client.post<{ success: true; data: PlaceWire }>('/admin/places', body);
  return mapPlace(res.data.data);
}

export async function updatePlaceRequest(
  id: string,
  body: Partial<PlaceInput>,
): Promise<Place> {
  const res = await client.patch<{ success: true; data: PlaceWire }>(
    `/admin/places/${id}`,
    body,
  );
  return mapPlace(res.data.data);
}

export async function deletePlaceRequest(id: string): Promise<void> {
  await client.delete(`/admin/places/${id}`);
}

export interface PlaceProposalImage {
  url: string;
  is_main: boolean;
}

export interface PlaceProposal {
  id: string;
  user_id: string;
  place_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: number;
  payload: {
    name: string;
    slug: string;
    category: string;
    type: string | null;
    lat: number | null;
    lng: number | null;
    maps_url: string | null;
    short_description: string;
    region_id: string | null;
    village_id: string | null;
    hours: string | null;
    contact: string | null;
    images: PlaceProposalImage[];
  };
}

interface PlaceProposalWire {
  id: string;
  user_id: string;
  place_id: string | null;
  status: PlaceProposal['status'];
  created_at?: number;
  payload?: Partial<PlaceProposal['payload']> | null;
}

function mapProposal(raw: PlaceProposalWire): PlaceProposal {
  const payload = raw.payload ?? {};
  return {
    id: raw.id,
    user_id: raw.user_id,
    place_id: raw.place_id,
    status: raw.status,
    created_at: raw.created_at ?? 0,
    payload: {
      name: payload.name ?? 'Usulan',
      slug: payload.slug ?? '',
      category: payload.category ?? '',
      type: payload.type ?? null,
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      maps_url: payload.maps_url ?? null,
      short_description: payload.short_description ?? '',
      region_id: payload.region_id ?? null,
      village_id: payload.village_id ?? null,
      hours: payload.hours ?? null,
      contact: payload.contact ?? null,
      images: Array.isArray(payload.images) ? payload.images : [],
    },
  };
}

export async function listPendingProposals(): Promise<PlaceProposal[]> {
  const res = await client.get<{ success: true; data: { items: PlaceProposalWire[] } }>(
    '/admin/place-contributions',
  );
  return res.data.data.items.map(mapProposal);
}

export async function reviewProposal(
  id: string,
  action: 'approve' | 'reject',
  reject?: { reason_code: string; reason_text?: string },
): Promise<void> {
  await client.post(`/admin/place-contributions/${id}/${action}`, reject);
}

/** Total view per place_id. `days` undefined = semua waktu. */
export async function listPlaceViewsRequest(
  days?: number,
  signal?: AbortSignal,
): Promise<Map<string, number>> {
  const res = await client.get<{
    success: true;
    data: { items: Array<{ place_id: string; views: number }> };
  }>('/admin/places/views', { params: days ? { days } : undefined, signal });
  return new Map(res.data.data.items.map((i) => [i.place_id, i.views]));
}

export interface PlaceViewsReport {
  trend: Array<{ day: string; total: number }>;
  items: Array<{
    placeId: string;
    name: string;
    slug: string;
    category: string;
    views: number;
    lastViewed: string | null;
  }>;
}

/** Laporan tren harian + ranking untuk halaman analitik wisata. */
export async function getPlaceViewsReportRequest(
  days: number,
  signal?: AbortSignal,
): Promise<PlaceViewsReport> {
  const res = await client.get<{ success: true; data: PlaceViewsReport }>(
    '/admin/places/views/daily',
    { params: { days }, signal },
  );
  return res.data.data;
}
