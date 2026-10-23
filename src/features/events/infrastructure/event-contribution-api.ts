import { client } from '@/shared/api/client';
import type {
  EventContribution,
  EventContributionPayload,
  EventContributionStatus,
  EventSourceType,
} from '../domain/event';

export interface EventContributionWire {
  id: string;
  user_id: string;
  event_id: string | null;
  status: EventContributionStatus;
  revision_note: string | null;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  reject_reason_display: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
  payload: EventContributionPayload;
}

export function mapContribution(w: EventContributionWire): EventContribution {
  const p = w.payload;
  return {
    id: w.id,
    userId: w.user_id,
    eventId: w.event_id,
    status: w.status,
    revisionNote: w.revision_note,
    rejectReasonCode: w.reject_reason_code,
    rejectReasonText: w.reject_reason_text,
    rejectReasonDisplay: w.reject_reason_display,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    reviewedAt: w.reviewed_at,
    payload: {
      name: p.name,
      description: p.description,
      category_id: p.category_id,
      starts_at: p.starts_at,
      ends_at: p.ends_at,
      location_text: p.location_text,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      maps_url: p.maps_url ?? null,
      poster_url: p.poster_url ?? null,
      organizer: p.organizer ?? null,
      source_url: p.source_url ?? null,
      source_type: p.source_type ?? null,
      source_attribution: p.source_attribution ?? null,
      region_id: p.region_id ?? null,
      village_id: p.village_id ?? null,
      place_ids: p.place_ids ?? [],
    },
  };
}

/** Usulan acara yang menunggu tinjauan admin. */
export async function listPendingEventContributionsRequest(
  signal?: AbortSignal,
): Promise<EventContribution[]> {
  const res = await client.get<{
    success: true;
    data: { items: EventContributionWire[] };
  }>('/admin/event-contributions', { signal });
  return res.data.data.items.map(mapContribution);
}

export async function approveEventContributionRequest(id: string): Promise<void> {
  await client.post(`/admin/event-contributions/${id}/approve`);
}

export async function rejectEventContributionRequest(
  id: string,
  reject: { reason_code: string; reason_text?: string },
): Promise<void> {
  await client.post(`/admin/event-contributions/${id}/reject`, reject);
}

export async function requestEventRevisionRequest(
  id: string,
  note: string,
): Promise<void> {
  await client.post(`/admin/event-contributions/${id}/request-revision`, { note });
}

export type EventContributionRejectReasonCode =
  | 'not_suitable'
  | 'duplicate'
  | 'inaccurate'
  | 'past_event'
  | 'other';

export const EVENT_REJECT_REASON_OPTIONS: Array<{
  code: EventContributionRejectReasonCode;
  label: string;
}> = [
  { code: 'not_suitable', label: 'Tidak layak sebagai acara' },
  { code: 'duplicate', label: 'Sama dengan acara yang sudah terdaftar' },
  { code: 'inaccurate', label: 'Data atau jadwal tidak akurat' },
  { code: 'past_event', label: 'Acara sudah lewat' },
  { code: 'other', label: 'Lainnya' },
];

export const EVENT_SOURCE_TYPE_OPTIONS: Array<{
  value: EventSourceType;
  label: string;
}> = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Lainnya' },
];
