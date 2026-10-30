import { client } from '@/shared/api/client';

export type PantunReportStatus = 'open' | 'resolved' | 'dismissed';
export type PantunReportTarget = 'pantun' | 'pantun_reply';
export type PantunReportResolution = 'dismissed' | 'taken_down';

export interface PantunReport {
  id: string;
  targetType: PantunReportTarget;
  targetId: string;
  targetLines: string[] | null;
  targetStatus: string | null;
  targetUserId: string | null;
  targetUsername: string | null;
  targetDisplayName: string | null;
  userId: string;
  username: string | null;
  displayName: string | null;
  reasonCode: string;
  note: string | null;
  status: PantunReportStatus;
  resolution: PantunReportResolution | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface ReportWire {
  id: string;
  target_type: PantunReportTarget;
  target_id: string;
  target_lines: string[] | null;
  target_status: string | null;
  target_user_id: string | null;
  target_username: string | null;
  target_display_name: string | null;
  user_id: string;
  username: string | null;
  display_name: string | null;
  reason_code: string;
  note: string | null;
  status: PantunReportStatus;
  resolution: PantunReportResolution | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function listPantunReportsRequest(
  params: { status?: PantunReportStatus; limit?: number } = {},
  signal?: AbortSignal,
): Promise<PantunReport[]> {
  const res = await client.get<{
    success: true;
    data: ReportWire[];
    meta: { limit: number; next_cursor: string | null; has_more: boolean };
  }>('/admin/pantun-reports', {
    params: { limit: 50, ...params },
    signal,
  });
  return res.data.data.map((w) => ({
    id: w.id,
    targetType: w.target_type,
    targetId: w.target_id,
    targetLines: w.target_lines,
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

export async function resolvePantunReportRequest(
  id: string,
  body: { resolution: PantunReportResolution; note?: string | null },
): Promise<void> {
  await client.post(`/admin/pantun-reports/${id}/resolve`, body);
}

export const PANTUN_REPORT_REASON_LABEL: Record<string, string> = {
  inappropriate: 'Tidak pantas',
  sexual: 'Konten seksual',
  harassment: 'Pelecehan atau perundungan',
  hate_speech: 'Ujaran kebencian',
  spam: 'Spam',
  other: 'Lainnya',
};

export const PANTUN_REPORT_TARGET_LABEL: Record<PantunReportTarget, string> = {
  pantun: 'Pantun',
  pantun_reply: 'Balasan',
};
