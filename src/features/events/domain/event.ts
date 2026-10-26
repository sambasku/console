/** Id slug di tabel `event_categories`. */
export type EventCategory = string;

export type EventStatus = 'draft' | 'published' | 'archived';

/**
 * Status pelaksanaan - diturunkan read-time dari jadwal + pembatalan.
 * Tidak disimpan di DB (API hitung saat serialize).
 */
export type EventOccurrenceStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type EventSourceType =
  | 'facebook'
  | 'instagram'
  | 'website'
  | 'tiktok'
  | 'youtube'
  | 'whatsapp'
  | 'other';

export interface EventCategoryRef {
  id: string;
  name: string;
}

export interface EventVillageRef {
  id: string;
  name: string;
  slug: string | null;
}

export interface EventPlaceRef {
  id: string;
  slug: string;
  name: string;
  category: string | null;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: EventCategory;
  category: EventCategoryRef | null;
  startsAt: string;
  endsAt: string;
  occurrenceStatus: EventOccurrenceStatus;
  locationText: string;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  posterUrls: string[];
  /** Penyelenggara opsional - UI skip kalau kosong. */
  organizer: string | null;
  /** Link original konten. Disimpan bersih tanpa UTM (helper UTM saat render). */
  sourceUrl: string | null;
  sourceType: EventSourceType | null;
  sourceAttribution: string | null;
  regionId: string | null;
  villageId: string | null;
  village: EventVillageRef | null;
  places: EventPlaceRef[];
  status: EventStatus;
  cancelledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export type EventContributionStatus = 'pending' | 'needs_revision' | 'approved' | 'rejected';

export interface EventContributionPayload {
  name: string;
  description: string;
  category_id: string;
  starts_at: string;
  ends_at: string;
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
  place_ids: string[];
}

export interface EventContribution {
  id: string;
  userId: string;
  eventId: string | null;
  status: EventContributionStatus;
  revisionNote: string | null;
  rejectReasonCode: string | null;
  rejectReasonText: string | null;
  rejectReasonDisplay: string | null;
  createdAt: string;
  updatedAt: string | null;
  reviewedAt: string | null;
  payload: EventContributionPayload;
}
