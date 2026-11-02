import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  Cuisine,
  CuisinePlaceLink,
  CulinaryAvailability,
  CulinaryCategoryRef,
  CulinaryDuplicateCandidate,
  CulinaryImage,
  CulinaryPlace,
  CulinaryPlaceType,
  CulinaryPublishStatus,
  CulinarySource,
} from '../domain/culinary';

/** Wire payload kuliner - snake_case, dipetakan ke domain. */
interface CuisineWire {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category: CulinaryCategoryRef | null;
  origin_region: string | null;
  images: Array<{
    url: string;
    is_main: boolean;
    attribution: CulinaryImage['attribution'];
  }>;
  ingredients: string[];
  serving_suggestion: string | null;
  tags: string[];
  sources: Array<{
    name: string;
    type: string;
    address: string;
    license: string | null;
    license_url: string | null;
  }>;
  license: string | null;
  publish_status: CulinaryPublishStatus;
  restricted_reason: string | null;
  restricted_at: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  places?: Array<{
    id: string;
    cuisine_id: string;
    place_id: string;
    availability: string;
    note: string | null;
    cuisine_name: string | null;
    cuisine_slug: string | null;
    place_name: string | null;
    place_slug: string | null;
  }>;
}

interface PlaceWire {
  id: string;
  slug: string;
  name: string;
  type: CulinaryPlaceType | null;
  description: string | null;
  location_hint: string | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  social_url: string | null;
  cover_url: string | null;
  operational_status: CulinaryPlace['operationalStatus'];
  publish_status: CulinaryPublishStatus;
  restricted_reason: string | null;
  restricted_at: string | null;
  manager_id: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  cuisines?: CuisineWire['places'];
}

function mapLinks(links: CuisineWire['places']): CuisinePlaceLink[] {
  return (links ?? []).map((l) => ({
    id: l.id,
    cuisineId: l.cuisine_id,
    placeId: l.place_id,
    availability: l.availability as CulinaryAvailability,
    note: l.note,
    cuisineName: l.cuisine_name,
    cuisineSlug: l.cuisine_slug,
    placeName: l.place_name,
    placeSlug: l.place_slug,
  }));
}

export function mapCuisine(w: CuisineWire): Cuisine {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    description: w.description,
    categoryId: w.category_id,
    category: w.category,
    originRegion: w.origin_region,
    images: (w.images ?? []).map((img) => ({
      url: img.url,
      isMain: img.is_main,
      attribution: img.attribution,
    })),
    ingredients: w.ingredients ?? [],
    servingSuggestion: w.serving_suggestion,
    tags: w.tags ?? [],
    sources: (w.sources ?? []).map(
      (s): CulinarySource => ({
        name: s.name,
        type: s.type,
        address: s.address,
        license: s.license,
        licenseUrl: s.license_url,
      }),
    ),
    license: w.license,
    publishStatus: w.publish_status,
    restrictedReason: w.restricted_reason,
    restrictedAt: w.restricted_at,
    authorId: w.author_id,
    publishedAt: w.published_at,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    places: w.places ? mapLinks(w.places) : undefined,
  };
}

export function mapPlace(w: PlaceWire): CulinaryPlace {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    type: w.type,
    description: w.description,
    locationHint: w.location_hint,
    addressText: w.address_text,
    lat: w.lat,
    lng: w.lng,
    mapsUrl: w.maps_url,
    phone: w.phone,
    whatsapp: w.whatsapp,
    website: w.website,
    socialUrl: w.social_url,
    coverUrl: w.cover_url,
    operationalStatus: w.operational_status,
    publishStatus: w.publish_status,
    restrictedReason: w.restricted_reason,
    restrictedAt: w.restricted_at,
    managerId: w.manager_id,
    authorId: w.author_id,
    publishedAt: w.published_at,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    cuisines: w.cuisines ? mapLinks(w.cuisines) : undefined,
  };
}

export type CulinaryKind = 'cuisine' | 'place';

export interface CulinaryListParams {
  limit: number;
  before?: string;
  q?: string;
  status?: CulinaryPublishStatus;
  category_id?: string;
  type?: CulinaryPlaceType;
  operational_status?: CulinaryPlace['operationalStatus'];
}

const SEGMENT: Record<CulinaryKind, string> = {
  cuisine: 'cuisines',
  place: 'places',
};

export async function listCuisinesRequest(
  params: CulinaryListParams,
  signal?: AbortSignal,
) {
  const res = await client.get<{
    success: true;
    data: { items: CuisineWire[]; next_cursor: string | null };
  }>('/admin/culinary/cuisines', { params, signal });
  return {
    items: res.data.data.items.map(mapCuisine),
    nextCursor: res.data.data.next_cursor,
  };
}

export async function listPlacesRequest(
  params: CulinaryListParams,
  signal?: AbortSignal,
) {
  const res = await client.get<{
    success: true;
    data: { items: PlaceWire[]; next_cursor: string | null };
  }>('/admin/culinary/places', { params, signal });
  return {
    items: res.data.data.items.map(mapPlace),
    nextCursor: res.data.data.next_cursor,
  };
}

export async function listCulinaryCategoriesRequest(
  signal?: AbortSignal,
): Promise<CulinaryCategoryRef[]> {
  const res = await client.get<{
    success: true;
    data: { items: CulinaryCategoryRef[] };
  }>('/admin/culinary/categories', { signal });
  return res.data.data.items;
}

export interface CuisineInput {
  slug: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  origin_region?: string | null;
  images?: Array<{
    url: string;
    is_main?: boolean;
    attribution?: CulinaryImage['attribution'];
  }>;
  ingredients?: string[];
  serving_suggestion?: string | null;
  tags?: string[];
  sources?: Array<{
    name: string;
    type: string;
    address: string;
    license?: string | null;
    license_url?: string | null;
  }>;
  publish_status?: CulinaryPublishStatus;
}

export interface PlaceInput {
  slug: string;
  name: string;
  type?: CulinaryPlaceType | null;
  description?: string | null;
  location_hint?: string | null;
  address_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  social_url?: string | null;
  cover_url?: string | null;
  operational_status?: CulinaryPlace['operationalStatus'];
  publish_status?: CulinaryPublishStatus;
}

export async function createCuisineRequest(body: CuisineInput): Promise<Cuisine> {
  const res = await client.post<ApiOkEnvelope<CuisineWire>>(
    '/admin/culinary/cuisines',
    body,
  );
  return mapCuisine(res.data.data);
}

export async function updateCuisineRequest(
  id: string,
  body: Partial<CuisineInput>,
): Promise<Cuisine> {
  const res = await client.patch<ApiOkEnvelope<CuisineWire>>(
    `/admin/culinary/cuisines/${id}`,
    body,
  );
  return mapCuisine(res.data.data);
}

export async function deleteCuisineRequest(id: string): Promise<void> {
  await client.delete(`/admin/culinary/cuisines/${id}`);
}

export async function restrictCuisineRequest(
  id: string,
  reason: string,
): Promise<Cuisine> {
  const res = await client.post<ApiOkEnvelope<CuisineWire>>(
    `/admin/culinary/cuisines/${id}/restrict`,
    { reason },
  );
  return mapCuisine(res.data.data);
}

export async function restoreCuisineRequest(id: string): Promise<Cuisine> {
  const res = await client.post<ApiOkEnvelope<CuisineWire>>(
    `/admin/culinary/cuisines/${id}/restore`,
  );
  return mapCuisine(res.data.data);
}

export async function createPlaceRequest(body: PlaceInput): Promise<CulinaryPlace> {
  const res = await client.post<ApiOkEnvelope<PlaceWire>>(
    '/admin/culinary/places',
    body,
  );
  return mapPlace(res.data.data);
}

export async function updatePlaceRequest(
  id: string,
  body: Partial<PlaceInput>,
): Promise<CulinaryPlace> {
  const res = await client.patch<ApiOkEnvelope<PlaceWire>>(
    `/admin/culinary/places/${id}`,
    body,
  );
  return mapPlace(res.data.data);
}

export async function deletePlaceRequest(id: string): Promise<void> {
  await client.delete(`/admin/culinary/places/${id}`);
}

export async function restrictPlaceRequest(
  id: string,
  reason: string,
): Promise<CulinaryPlace> {
  const res = await client.post<ApiOkEnvelope<PlaceWire>>(
    `/admin/culinary/places/${id}/restrict`,
    { reason },
  );
  return mapPlace(res.data.data);
}

export async function restorePlaceRequest(id: string): Promise<CulinaryPlace> {
  const res = await client.post<ApiOkEnvelope<PlaceWire>>(
    `/admin/culinary/places/${id}/restore`,
  );
  return mapPlace(res.data.data);
}

export async function listCulinaryDuplicatesRequest(
  kind: CulinaryKind,
  params: { q: string; exclude_id?: string },
  signal?: AbortSignal,
): Promise<CulinaryDuplicateCandidate[]> {
  const res = await client.get<{
    success: true;
    data: { items: CulinaryDuplicateCandidate[] };
  }>(`/admin/culinary/${SEGMENT[kind]}/duplicates`, { params, signal });
  return res.data.data.items;
}

/** Upload foto kuliner ke POST /images?purpose=culinary (kompres WebP). */
export async function uploadCulinaryImage(file: File): Promise<string> {
  const { compressImageForUpload } = await import('@/shared/utils/compress-image');
  const compressed = await compressImageForUpload(file);
  if (compressed.size > 5 * 1024 * 1024) {
    throw new Error('Gambar masih terlalu besar setelah dikompresi (maks 5 MB)');
  }
  const form = new FormData();
  form.append('file', compressed);
  const res = await client.post<ApiOkEnvelope<{ url: string }>>(
    '/images?purpose=culinary',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data.url;
}
