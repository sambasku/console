/** Id slug di tabel `usaha_categories`. */
export type UsahaCategory = string;

/**
 * Status publikasi (dimensi 1). `restricted` = dibatasi sementara admin.
 * Terpisah dari status operasional - jangan digabung jadi satu kolom.
 */
export type UsahaPublishStatus = 'draft' | 'published' | 'archived' | 'restricted';

/** Status operasional (dimensi 2) - info buka/tutup, bukan moderasi. */
export type UsahaOperationalStatus =
  | 'unknown'
  | 'open'
  | 'temporarily_closed'
  | 'permanently_closed';

export type UsahaKind = 'product' | 'service' | 'both';

export interface UsahaCategoryRef {
  id: string;
  name: string;
}

export interface UsahaVillageRef {
  id: string;
  name: string;
  slug: string | null;
}

export interface UsahaItem {
  id: string;
  name: string;
  description: string | null;
  priceText: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface Usaha {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: UsahaCategoryRef | null;
  kind: UsahaKind;
  regionId: string | null;
  villageId: string | null;
  village: UsahaVillageRef | null;
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  socialUrl: string | null;
  coverUrl: string | null;
  publishStatus: UsahaPublishStatus;
  operationalStatus: UsahaOperationalStatus;
  restrictedReason: string | null;
  restrictedAt: string | null;
  managerId: string | null;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  items?: UsahaItem[];
}

export type UsahaContributionKind =
  | 'new'
  | 'profile'
  | 'item_add'
  | 'item_edit'
  | 'item_delete'
  | 'operational'
  | 'archive'
  | 'restore';

export type UsahaContributionStatus =
  | 'pending'
  | 'needs_revision'
  | 'approved'
  | 'rejected';

export interface UsahaContribution {
  id: string;
  kind: UsahaContributionKind;
  status: UsahaContributionStatus;
  usahaId: string | null;
  usahaSlug: string | null;
  usahaName: string | null;
  itemId: string | null;
  /** Field yang diajukan (dasar field-lock) - tampilkan sebagai diff. */
  fields: string[];
  payload: Record<string, unknown>;
  wantsClaim: boolean;
  resultUsahaId: string | null;
  revisionNote: string | null;
  rejectReasonCode: string | null;
  rejectReasonText: string | null;
  createdAt: string;
  updatedAt: string | null;
  reviewedAt: string | null;
}

export type UsahaClaimStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface UsahaClaim {
  id: string;
  usahaId: string;
  usahaSlug?: string;
  usahaName?: string;
  note: string | null;
  status: UsahaClaimStatus;
  rejectReasonCode: string | null;
  rejectReasonText: string | null;
  createdAt: string;
  reviewedAt: string | null;
  /** Hanya ada di wire admin - bukti privat, jangan pernah dirender di publik. */
  contactEvidence?: string;
  userId?: string;
  reviewedBy?: string | null;
}

export type UsahaReportStatus = 'open' | 'resolved' | 'dismissed';

export interface UsahaReport {
  id: string;
  usahaId: string;
  usahaSlug?: string;
  usahaName?: string;
  reasonCode: string;
  note: string | null;
  status: UsahaReportStatus;
  resolution: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface UsahaCategoryItem {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  sortOrder: number;
  createdAt: number;
  updatedAt: number | null;
}

/** Duplikat read-only (PRD 14) - tidak pernah merge otomatis. */
export interface UsahaDuplicateCandidate {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  managerId: string | null;
}
