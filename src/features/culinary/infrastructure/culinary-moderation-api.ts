import { client } from '@/shared/api/client';
import type {
  CulinaryClaim,
  CulinaryClaimStatus,
  CulinaryReport,
  CulinaryReportStatus,
} from '../domain/culinary';

interface ClaimWire {
  id: string;
  place_id: string;
  place_slug?: string;
  place_name?: string;
  note: string | null;
  status: CulinaryClaimStatus;
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
  target_type: 'cuisine' | 'place';
  target_id: string;
  target_slug?: string | null;
  target_name?: string | null;
  reason_code: string;
  note: string | null;
  status: CulinaryReportStatus;
  resolution: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** Antrean klaim (wire admin - termasuk bukti kontak, JANGAN dirender publik). */
export async function listCulinaryClaimsRequest(
  params: { status?: CulinaryClaimStatus } = {},
  signal?: AbortSignal,
): Promise<CulinaryClaim[]> {
  const res = await client.get<{
    success: true;
    data: { items: ClaimWire[] };
  }>('/admin/culinary-claims', { params, signal });
  return res.data.data.items.map((w) => ({
    id: w.id,
    placeId: w.place_id,
    placeSlug: w.place_slug,
    placeName: w.place_name,
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

export async function approveCulinaryClaimRequest(id: string): Promise<void> {
  await client.post(`/admin/culinary-claims/${id}/approve`);
}

export async function rejectCulinaryClaimRequest(
  id: string,
  reason: { reason_code: string; reason_text?: string | null },
): Promise<void> {
  await client.post(`/admin/culinary-claims/${id}/reject`, reason);
}

export const CULINARY_CLAIM_REJECT_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'evidence_insufficient', label: 'Bukti kontak kurang kuat' },
  { code: 'claim_conflict', label: 'Tempat sudah dikelola pihak lain' },
  { code: 'not_owner', label: 'Bukan pemilik atau pengelola sah' },
  { code: 'other', label: 'Alasan lain' },
];

export async function listCulinaryReportsRequest(
  params: { status?: CulinaryReportStatus } = {},
  signal?: AbortSignal,
): Promise<CulinaryReport[]> {
  const res = await client.get<{
    success: true;
    data: { items: ReportWire[] };
  }>('/admin/culinary-reports', { params, signal });
  return res.data.data.items.map((w) => ({
    id: w.id,
    targetType: w.target_type,
    targetId: w.target_id,
    targetSlug: w.target_slug,
    targetName: w.target_name,
    reasonCode: w.reason_code,
    note: w.note,
    status: w.status,
    resolution: w.resolution,
    resolutionNote: w.resolution_note,
    createdAt: w.created_at,
    resolvedAt: w.resolved_at,
  }));
}

export async function resolveCulinaryReportRequest(
  id: string,
  body: {
    status: 'resolved' | 'dismissed';
    resolution: string;
    resolution_note?: string | null;
  },
): Promise<void> {
  await client.post(`/admin/culinary-reports/${id}/resolve`, body);
}

export const CULINARY_REPORT_REASON_LABEL: Record<string, string> = {
  closed: 'Tempat sudah tutup',
  wrong_location: 'Lokasi tidak sesuai',
  invalid_contact: 'Kontak tidak valid',
  misleading: 'Informasi menyesatkan',
  duplicate: 'Dugaan duplikat',
  abuse: 'Dugaan pelanggaran',
};

export const CULINARY_REPORT_TARGET_LABEL: Record<'cuisine' | 'place', string> = {
  cuisine: 'Kuliner',
  place: 'Tempat',
};
