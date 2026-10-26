import { client } from '@/shared/api/client';
import type {
  CulinaryContribution,
  CulinaryContributionKind,
  CulinaryContributionStatus,
} from '../domain/culinary';

interface ContributionWire {
  id: string;
  kind: CulinaryContributionKind;
  status: CulinaryContributionStatus;
  cuisine_id: string | null;
  cuisine_slug: string | null;
  cuisine_name: string | null;
  place_id: string | null;
  place_slug: string | null;
  place_name: string | null;
  link_id: string | null;
  fields: string[];
  payload: Record<string, unknown>;
  result_cuisine_id: string | null;
  result_place_id: string | null;
  revision_note: string | null;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
}

function mapContribution(w: ContributionWire): CulinaryContribution {
  return {
    id: w.id,
    kind: w.kind,
    status: w.status,
    cuisineId: w.cuisine_id,
    cuisineSlug: w.cuisine_slug,
    cuisineName: w.cuisine_name,
    placeId: w.place_id,
    placeSlug: w.place_slug,
    placeName: w.place_name,
    linkId: w.link_id,
    fields: w.fields ?? [],
    payload: w.payload ?? {},
    resultCuisineId: w.result_cuisine_id,
    resultPlaceId: w.result_place_id,
    revisionNote: w.revision_note,
    rejectReasonCode: w.reject_reason_code,
    rejectReasonText: w.reject_reason_text,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    reviewedAt: w.reviewed_at,
  };
}

export const CULINARY_CONTRIBUTION_KIND_LABEL: Record<
  CulinaryContributionKind,
  string
> = {
  new_cuisine: 'Usulan kuliner baru',
  new_place: 'Usulan tempat baru',
  link: 'Usulan hubungan kuliner-tempat',
  cuisine_edit: 'Perbaikan data kuliner',
  place_edit: 'Perbaikan data tempat',
  link_edit: 'Ubah ketersediaan relasi',
  place_operational: 'Status operasional tempat',
  archive: 'Minta arsip',
  restore: 'Minta tayang lagi',
};

export const CULINARY_CONTRIBUTION_STATUS_LABEL: Record<
  CulinaryContributionStatus,
  string
> = {
  pending: 'Menunggu tinjauan',
  needs_revision: 'Perlu revisi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

/** Label field pengajuan untuk diff - kunci payload kanonik. */
export const CULINARY_FIELD_LABEL: Record<string, string> = {
  name: 'Nama',
  description: 'Deskripsi',
  categoryId: 'Kategori',
  originRegion: 'Daerah asal',
  images: 'Gambar',
  ingredients: 'Bahan',
  servingSuggestion: 'Cara penyajian',
  tags: 'Tag',
  sources: 'Sumber',
  type: 'Jenis tempat',
  locationHint: 'Patokan lokasi',
  addressText: 'Alamat',
  lat: 'Latitude',
  lng: 'Longitude',
  mapsUrl: 'Peta',
  phone: 'Telepon',
  whatsapp: 'WhatsApp',
  website: 'Website',
  socialUrl: 'Media sosial',
  coverUrl: 'Foto utama',
  operationalStatus: 'Status operasional',
  publishStatus: 'Status publikasi',
  cuisineSlug: 'Kuliner',
  placeSlug: 'Tempat',
  availability: 'Ketersediaan',
  note: 'Catatan',
};

export async function listCulinaryContributionsRequest(
  params: {
    status?: CulinaryContributionStatus;
    kind?: CulinaryContributionKind;
  } = {},
  signal?: AbortSignal,
): Promise<CulinaryContribution[]> {
  const res = await client.get<{
    success: true;
    data: { items: ContributionWire[] };
  }>('/admin/culinary-contributions', { params, signal });
  return res.data.data.items.map(mapContribution);
}

export async function approveCulinaryContributionRequest(
  id: string,
  images?: Array<{
    url: string;
    is_main?: boolean;
    attribution?: { name?: string; license?: string; url?: string } | null;
  }>,
): Promise<void> {
  await client.post(`/admin/culinary-contributions/${id}/approve`, images ? { images } : undefined);
}

export async function rejectCulinaryContributionRequest(
  id: string,
  reason: { reason_code: string; reason_text?: string | null },
): Promise<void> {
  await client.post(`/admin/culinary-contributions/${id}/reject`, reason);
}

export async function requestCulinaryRevisionRequest(
  id: string,
  note: string,
): Promise<void> {
  await client.post(`/admin/culinary-contributions/${id}/request-revision`, { note });
}

export type CulinaryContributionRejectReasonCode =
  | 'duplicate'
  | 'incomplete'
  | 'invalid'
  | 'unverifiable'
  | 'attribution'
  | 'violation'
  | 'stale'
  | 'other';

export const CULINARY_CONTRIBUTION_REJECT_REASON_OPTIONS: Array<{
  code: CulinaryContributionRejectReasonCode;
  label: string;
}> = [
  { code: 'duplicate', label: 'Kuliner/tempat serupa sudah terdaftar' },
  { code: 'incomplete', label: 'Informasi belum lengkap' },
  { code: 'invalid', label: 'Data tidak valid' },
  { code: 'unverifiable', label: 'Belum bisa diverifikasi' },
  { code: 'attribution', label: 'Atribusi gambar belum lengkap' },
  { code: 'stale', label: 'Data sudah berubah, perlu ajukan ulang' },
  { code: 'violation', label: 'Melanggar ketentuan' },
  { code: 'other', label: 'Alasan lain' },
];
