import { client } from '@/shared/api/client';
import type { Announcement, AnnouncementBodyType } from '../domain/announcement';

interface AnnouncementWire {
  id: string;
  title: string;
  body: string;
  body_type: AnnouncementBodyType;
  action_url: string | null;
  action_label: string | null;
  created_by: string;
  expires_at: number | null;
  created_at: number;
  updated_at: number | null;
}

function mapAnnouncement(w: AnnouncementWire): Announcement {
  return {
    id: w.id,
    title: w.title,
    body: w.body,
    bodyType: w.body_type ?? 'plain',
    actionUrl: w.action_url,
    actionLabel: w.action_label,
    createdBy: w.created_by,
    expiresAt: w.expires_at,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export interface AnnouncementListResult {
  items: Announcement[];
  nextCursor: string | null;
}

export async function listAnnouncementsRequest(
  params: { limit?: number; before?: string } = {},
  signal?: AbortSignal,
): Promise<AnnouncementListResult> {
  const res = await client.get<{ success: true; data: { items: AnnouncementWire[]; next_cursor: string | null } }>(
    '/admin/announcements',
    { params: { limit: params.limit ?? 20, before: params.before }, signal },
  );
  return { items: res.data.data.items.map(mapAnnouncement), nextCursor: res.data.data.next_cursor };
}

export type AnnouncementInput = {
  title: string;
  body: string;
  body_type?: AnnouncementBodyType;
  action_url?: string | null;
  action_label?: string | null;
  expires_at?: number | null;
};

export async function createAnnouncementRequest(body: AnnouncementInput): Promise<Announcement> {
  const res = await client.post<{ success: true; data: AnnouncementWire }>('/admin/announcements', body);
  return mapAnnouncement(res.data.data);
}

export async function updateAnnouncementRequest(
  id: string,
  body: Partial<AnnouncementInput>,
): Promise<Announcement> {
  const res = await client.patch<{ success: true; data: AnnouncementWire }>(
    `/admin/announcements/${id}`,
    body,
  );
  return mapAnnouncement(res.data.data);
}

export async function deleteAnnouncementRequest(id: string): Promise<void> {
  await client.delete(`/admin/announcements/${id}`);
}
