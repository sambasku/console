import { client } from '@/shared/api/client';

export type JinyeReportStatus = 'open' | 'resolved' | 'dismissed';
export type JinyeReportTarget = 'jinye' | 'jinye_comment';
export type JinyeReportResolution = 'dismissed' | 'taken_down';

export interface JinyeReport {
  id: string;
  targetType: JinyeReportTarget;
  targetId: string;
  targetBody: string | null;
  targetHasImages: boolean;
  targetHasAudio: boolean;
  targetStatus: string | null;
  targetUserId: string | null;
  targetUsername: string | null;
  targetDisplayName: string | null;
  userId: string;
  username: string | null;
  displayName: string | null;
  reasonCode: string;
  note: string | null;
  status: JinyeReportStatus;
  resolution: JinyeReportResolution | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface ReportWire {
  id: string;
  target_type: JinyeReportTarget;
  target_id: string;
  target_body: string | null;
  target_has_images: boolean;
  target_has_audio: boolean;
  target_status: string | null;
  target_user_id: string | null;
  target_username: string | null;
  target_display_name: string | null;
  user_id: string;
  username: string | null;
  display_name: string | null;
  reason_code: string;
  note: string | null;
  status: JinyeReportStatus;
  resolution: JinyeReportResolution | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function listJinyeReportsRequest(
  params: { status?: JinyeReportStatus; limit?: number } = {},
  signal?: AbortSignal,
): Promise<JinyeReport[]> {
  const res = await client.get<{
    success: true;
    data: ReportWire[];
    meta: { limit: number; next_cursor: string | null; has_more: boolean };
  }>('/admin/jinye-reports', {
    params: { limit: 50, ...params },
    signal,
  });
  return res.data.data.map((w) => ({
    id: w.id,
    targetType: w.target_type,
    targetId: w.target_id,
    targetBody: w.target_body,
    targetHasImages: w.target_has_images,
    targetHasAudio: w.target_has_audio,
    targetStatus: w.target_status,
    targetUserId: w.target_user_id,
    targetUsername: w.target_username,
    targetDisplayName: w.target_display_name,
    userId: w.user_id,
    username: w.username,
    displayName: w.display_name,
    reasonCode: w.reason_code,
    note: w.note,
    status: w.status,
    resolution: w.resolution,
    resolutionNote: w.resolution_note,
    createdAt: w.created_at,
    resolvedAt: w.resolved_at,
  }));
}

export async function resolveJinyeReportRequest(
  id: string,
  body: { resolution: JinyeReportResolution; note?: string | null },
): Promise<void> {
  await client.post(`/admin/jinye-reports/${id}/resolve`, body);
}

export const JINYE_REPORT_REASON_LABEL: Record<string, string> = {
  inappropriate: 'Tidak pantas',
  sexual: 'Konten seksual',
  harassment: 'Pelecehan atau perundungan',
  hate_speech: 'Ujaran kebencian',
  spam: 'Spam',
  other: 'Lainnya',
};

export const JINYE_REPORT_TARGET_LABEL: Record<JinyeReportTarget, string> = {
  jinye: 'Jinye',
  jinye_comment: 'Komentar',
};
