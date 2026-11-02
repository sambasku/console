import { client } from '@/shared/api/client';
import type {
  Event,
  EventCategoryRef,
  EventOccurrenceStatus,
  EventPlaceRef,
  EventSourceType,
  EventStatus,
  EventVillageRef,
} from '../domain/event';

export interface EventWire {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  category: EventCategoryRef | null;
  starts_at: string;
  ends_at: string;
  occurrence_status: EventOccurrenceStatus;
  location_text: string;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  poster_urls: string[];
  organizer: string | null;
  source_url: string | null;
  source_type: EventSourceType | null;
  source_attribution: string | null;
  region_id: string | null;
  village_id: string | null;
  village: EventVillageRef | null;
  places: EventPlaceRef[];
  status: EventStatus;
  cancelled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export function mapEvent(w: EventWire): Event {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    description: w.description,
    categoryId: w.category_id,
    category: w.category,
    startsAt: w.starts_at,
    endsAt: w.ends_at,
    occurrenceStatus: w.occurrence_status,
    locationText: w.location_text,
    lat: w.lat,
    lng: w.lng,
    mapsUrl: w.maps_url,
    posterUrls: w.poster_urls ?? [],
    organizer: w.organizer,
    sourceUrl: w.source_url,
    sourceType: w.source_type,
    sourceAttribution: w.source_attribution,
    regionId: w.region_id,
    villageId: w.village_id,
    village: w.village,
    places: w.places ?? [],
    status: w.status,
    cancelledAt: w.cancelled_at,
    publishedAt: w.published_at,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export interface EventListResult {
  items: Event[];
  nextCursor: string | null;
}

export async function listEventsRequest(
  params: {
    limit?: number;
    before?: string;
    category_id?: string;
    village_id?: string;
    place_id?: string;
    q?: string;
    status?: EventStatus;
    not_ended?: '1';
    order?: 'asc' | 'desc';
  } = {},
  signal?: AbortSignal,
): Promise<EventListResult> {
  const res = await client.get<{
    success: true;
    data: { items: EventWire[]; next_cursor: string | null };
  }>('/admin/events', { params, signal });
  return {
    items: res.data.data.items.map(mapEvent),
    nextCursor: res.data.data.next_cursor,
  };
}

/** Katalog kategori acara (published saja). */
export async function listEventCategoriesRequest(
  signal?: AbortSignal,
): Promise<EventCategoryRef[]> {
  const res = await client.get<{
    success: true;
    data: { items: EventCategoryRef[] };
  }>('/events/categories', { signal });
  return res.data.data.items;
}

export type EventInput = {
  slug: string;
  name: string;
  description: string;
  category_id: string;
  starts_at: string;
  ends_at: string;
  location_text: string;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  poster_urls?: string[];
  organizer?: string | null;
  source_url?: string | null;
  source_type?: EventSourceType | null;
  source_attribution?: string | null;
  region_id?: string | null;
  village_id?: string | null;
  place_ids?: string[];
  author_id?: string | null;
  status?: EventStatus;
};

export async function createEventRequest(body: EventInput): Promise<Event> {
  const res = await client.post<{ success: true; data: EventWire }>('/admin/events', body);
  return mapEvent(res.data.data);
}

export async function updateEventRequest(
  id: string,
  body: Partial<EventInput>,
): Promise<Event> {
  const res = await client.patch<{ success: true; data: EventWire }>(
    `/admin/events/${id}`,
    body,
  );
  return mapEvent(res.data.data);
}

/** Tandai batal / pulihkan. `cancelled_at` = null kalau dipulihkan. */
export async function setEventCancelledRequest(
  id: string,
  cancelled: boolean,
): Promise<Event> {
  const res = await client.post<{ success: true; data: EventWire }>(
    `/admin/events/${id}/cancel`,
    { cancelled },
  );
  return mapEvent(res.data.data);
}

export async function deleteEventRequest(id: string): Promise<void> {
  await client.delete(`/admin/events/${id}`);
}
