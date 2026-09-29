import { client } from '@/shared/api/client';
import type { ApiCursorPageEnvelope, ApiOkEnvelope, CursorPage } from '@/shared/api/types';
import type {
  AnonAbuseEvent,
  AnonMute,
  AnonSubjectKind,
  UserAbuseEvent,
  UserAbuseHistoryItem,
} from '../domain/abuse';

const PAGE_LIMIT = 20;

export async function listUserAbuseEventsRequest(
  params: { signal?: string; userName?: string; cursor?: string },
  abort?: AbortSignal,
): Promise<CursorPage<UserAbuseEvent>> {
  const res = await client.get<ApiCursorPageEnvelope<UserAbuseEvent>>('/admin/abuse/user-events', {
    params: {
      signal: params.signal || undefined,
      user_name: params.userName || undefined,
      limit: PAGE_LIMIT,
      cursor: params.cursor,
    },
    signal: abort,
  });
  return { data: res.data.data, meta: res.data.meta };
}

export async function listAnonAbuseEventsRequest(
  params: { subjectKind?: AnonSubjectKind; subjectKey?: string; signal?: string; cursor?: string },
  abort?: AbortSignal,
): Promise<CursorPage<AnonAbuseEvent>> {
  const res = await client.get<ApiCursorPageEnvelope<AnonAbuseEvent>>('/admin/abuse/anon-events', {
    params: {
      subject_kind: params.subjectKind || undefined,
      subject_key: params.subjectKey || undefined,
      signal: params.signal || undefined,
      limit: PAGE_LIMIT,
      cursor: params.cursor,
    },
    signal: abort,
  });
  return { data: res.data.data, meta: res.data.meta };
}

export async function listAnonMutesRequest(abort?: AbortSignal): Promise<AnonMute[]> {
  const res = await client.get<ApiOkEnvelope<AnonMute[]>>('/admin/abuse/anon-mutes', { signal: abort });
  return res.data.data;
}

export async function liftAnonMuteRequest(subjectKind: AnonSubjectKind, subjectKey: string): Promise<void> {
  await client.post('/admin/abuse/anon-mutes/lift', { subject_kind: subjectKind, subject_key: subjectKey });
}

export async function liftUserMuteRequest(userId: string): Promise<void> {
  await client.post(`/admin/abuse/users/${userId}/lift-mute`);
}

export async function listUserAbuseHistoryRequest(
  userId: string,
  cursor: string | undefined,
  abort?: AbortSignal,
): Promise<CursorPage<UserAbuseHistoryItem>> {
  const res = await client.get<ApiCursorPageEnvelope<UserAbuseHistoryItem>>(
    `/admin/users/${userId}/abuse-events`,
    { params: { limit: PAGE_LIMIT, cursor }, signal: abort },
  );
  return { data: res.data.data, meta: res.data.meta };
}
