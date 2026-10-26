import { client } from '@/shared/api/client';
import type {
  UsahaContribution,
  UsahaContributionKind,
  UsahaContributionStatus,
} from '../domain/usaha';

interface ContributionWire {
  id: string;
  kind: UsahaContributionKind;
  status: UsahaContributionStatus;
  usaha_id: string | null;
  usaha_slug: string | null;
  usaha_name: string | null;
  item_id: string | null;
  fields: string[];
  payload: Record<string, unknown>;
  wants_claim: boolean;
  result_usaha_id: string | null;
  revision_note: string | null;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
}

function mapContribution(w: ContributionWire): UsahaContribution {
  return {
    id: w.id,
    kind: w.kind,
    status: w.status,
    usahaId: w.usaha_id,
    usahaSlug: w.usaha_slug,
    usahaName: w.usaha_name,
    itemId: w.item_id,
    fields: w.fields ?? [],
    payload: w.payload ?? {},
    wantsClaim: w.wants_claim,
    resultUsahaId: w.result_usaha_id,
    revisionNote: w.revision_note,
    rejectReasonCode: w.reject_reason_code,
    rejectReasonText: w.reject_reason_text,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    reviewedAt: w.reviewed_at,
  };
}

export const USAHA_CONTRIBUTION_KIND_LABEL: Record<UsahaContributionKind, string> = {
  new: 'Usulan usaha baru',
  profile: 'Perubahan profil',
  item_add: 'Tambah item katalog',
  item_edit: 'Ubah item katalog',
  item_delete: 'Hapus item katalog',
  operational: 'Status operasional',
  archive: 'Minta arsip',
  restore: 'Minta tayang lagi',
};

export const USAHA_CONTRIBUTION_STATUS_LABEL: Record<UsahaContributionStatus, string> = {
  pending: 'Menunggu tinjauan',
  needs_revision: 'Perlu revisi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

/** Label field pengajuan untuk diff - kunci payload kanonik. */
export const USAHA_FIELD_LABEL: Record<string, string> = {
  name: 'Nama',
  description: 'Deskripsi',
  categoryId: 'Kategori',
  kind: 'Jenis',
  regionId: 'Kecamatan',
  villageId: 'Desa',
  addressText: 'Alamat',
  lat: 'Latitude',
  lng: 'Longitude',
  phone: 'Telepon',
  whatsapp: 'WhatsApp',
  website: 'Website',
  socialUrl: 'Media sosial',
  coverUrl: 'Foto utama',
  operationalStatus: 'Status operasional',
  publishStatus: 'Status publikasi',
  items: 'Katalog item',
};

export async function listUsahaContributionsRequest(
  params: {
    status?: UsahaContributionStatus;
    kind?: UsahaContributionKind;
  } = {},
  signal?: AbortSignal,
): Promise<UsahaContribution[]> {
  const res = await client.get<{
    success: true;
    data: { items: ContributionWire[] };
  }>('/admin/usaha-contributions', { params, signal });
  return res.data.data.items.map(mapContribution);
}

export async function approveUsahaContributionRequest(id: string): Promise<void> {
  await client.post(`/admin/usaha-contributions/${id}/approve`);
}

export async function rejectUsahaContributionRequest(
  id: string,
  reason: { reason_code: string; reason_text?: string | null },
): Promise<void> {
  await client.post(`/admin/usaha-contributions/${id}/reject`, reason);
}

export async function requestUsahaRevisionRequest(
  id: string,
  note: string,
): Promise<void> {
  await client.post(`/admin/usaha-contributions/${id}/request-revision`, { note });
}

export type UsahaContributionRejectReasonCode =
  | 'duplicate'
  | 'incomplete'
  | 'invalid'
  | 'not_owner'
  | 'stale'
  | 'violation'
  | 'other';

export const USAHA_CONTRIBUTION_REJECT_REASON_OPTIONS: Array<{
  code: UsahaContributionRejectReasonCode;
  label: string;
}> = [
  { code: 'duplicate', label: 'Usaha serupa sudah terdaftar' },
  { code: 'incomplete', label: 'Informasi belum lengkap' },
  { code: 'invalid', label: 'Data tidak valid' },
  { code: 'not_owner', label: 'Bukan pengelola sah' },
  { code: 'stale', label: 'Data sudah berubah, perlu ajukan ulang' },
  { code: 'violation', label: 'Melanggar ketentuan' },
  { code: 'other', label: 'Alasan lain' },
];
