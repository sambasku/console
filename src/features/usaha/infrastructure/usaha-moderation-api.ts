import { client } from '@/shared/api/client';
import type { UsahaClaim, UsahaClaimStatus, UsahaReport, UsahaReportStatus } from '../domain/usaha';

interface ClaimWire {
  id: string;
  usaha_id: string;
  usaha_slug?: string;
  usaha_name?: string;
  note: string | null;
  status: UsahaClaimStatus;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  created_at: string;
  reviewed_at: string | null;
  contact_evidence?: string;
  user_id?: string;
  reviewed_by?: string | null;
}

interface ReportWire {
  id: string;
  usaha_id: string;
  usaha_slug?: string;
  usaha_name?: string;
  reason_code: string;
  note: string | null;
  status: UsahaReportStatus;
  resolution: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** Antrean klaim (wire admin - termasuk bukti kontak). */
export async function listUsahaClaimsRequest(
  params: { status?: UsahaClaimStatus } = {},
  signal?: AbortSignal,
): Promise<UsahaClaim[]> {
  const res = await client.get<{
    success: true;
    data: { items: ClaimWire[] };
  }>('/admin/usaha-claims', { params, signal });
  return res.data.data.items.map((w) => ({
    id: w.id,
    usahaId: w.usaha_id,
    usahaSlug: w.usaha_slug,
    usahaName: w.usaha_name,
    note: w.note,
    status: w.status,
    rejectReasonCode: w.reject_reason_code,
    rejectReasonText: w.reject_reason_text,
    createdAt: w.created_at,
    reviewedAt: w.reviewed_at,
    contactEvidence: w.contact_evidence,
    userId: w.user_id,
    reviewedBy: w.reviewed_by,
  }));
}

export async function approveUsahaClaimRequest(id: string): Promise<void> {
  await client.post(`/admin/usaha-claims/${id}/approve`);
}

export async function rejectUsahaClaimRequest(
  id: string,
  reason: { reason_code: string; reason_text?: string | null },
): Promise<void> {
  await client.post(`/admin/usaha-claims/${id}/reject`, reason);
}

export const USAHA_CLAIM_REJECT_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'evidence_insufficient', label: 'Bukti kontak kurang kuat' },
  { code: 'claim_conflict', label: 'Usaha sudah dikelola pihak lain' },
  { code: 'not_owner', label: 'Bukan pemilik atau pengelola sah' },
  { code: 'other', label: 'Alasan lain' },
];

export async function listUsahaReportsRequest(
  params: { status?: UsahaReportStatus } = {},
  signal?: AbortSignal,
): Promise<UsahaReport[]> {
  const res = await client.get<{
    success: true;
    data: { items: ReportWire[] };
  }>('/admin/usaha-reports', { params, signal });
  return res.data.data.items.map((w) => ({
    id: w.id,
    usahaId: w.usaha_id,
    usahaSlug: w.usaha_slug,
    usahaName: w.usaha_name,
    reasonCode: w.reason_code,
    note: w.note,
    status: w.status,
    resolution: w.resolution,
    resolutionNote: w.resolution_note,
    createdAt: w.created_at,
    resolvedAt: w.resolved_at,
  }));
}

export async function resolveUsahaReportRequest(
  id: string,
  body: { status: 'resolved' | 'dismissed'; resolution: string; resolution_note?: string | null },
): Promise<void> {
  await client.post(`/admin/usaha-reports/${id}/resolve`, body);
}

export const USAHA_REPORT_REASON_LABEL: Record<string, string> = {
  closed: 'Usaha sudah tutup',
  wrong_location: 'Lokasi salah',
  invalid_contact: 'Kontak tidak valid',
  misleading: 'Info menyesatkan',
  duplicate: 'Duplikat',
  abuse: 'Penyalahgunaan',
};
