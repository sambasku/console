/** Kuliner & tempat makan (PRD kuliner). Wire snake_case dipetakan di API layer. */

export type CulinaryPublishStatus = 'draft' | 'published' | 'archived' | 'restricted';

export type CulinaryOperationalStatus =
  | 'unknown'
  | 'operating'
  | 'temporarily_closed'
  | 'permanently_closed';

export type CulinaryAvailability = 'unknown' | 'available' | 'seasonal' | 'unavailable';

export type CulinaryPlaceType =
  | 'restaurant'
  | 'warung'
  | 'kedai'
  | 'market_stall'
  | 'street_vendor'
  | 'home_industry'
  | 'other';

export interface CulinaryCategoryRef {
  id: string;
  name: string;
}

/** Atribusi gambar: wajib, disimpan verbatim (PRD 13). */
export interface CulinaryImageAttribution {
  name?: string;
  provider?: string;
  url?: string;
  license?: string;
  license_url?: string;
}

export interface CulinaryImage {
  url: string;
  isMain: boolean;
  attribution: CulinaryImageAttribution | null;
}

export interface CulinarySource {
  name: string;
  type: string;
  address: string;
  license: string | null;
  licenseUrl: string | null;
}

export interface Cuisine {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: CulinaryCategoryRef | null;
  originRegion: string | null;
  images: CulinaryImage[];
  ingredients: string[];
  servingSuggestion: string | null;
  tags: string[];
  sources: CulinarySource[];
  license: string | null;
  publishStatus: CulinaryPublishStatus;
  restrictedReason: string | null;
  restrictedAt: string | null;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  places?: CuisinePlaceLink[];
}

export interface CuisinePlaceLink {
  id: string;
  cuisineId: string;
  placeId: string;
  availability: CulinaryAvailability;
  note: string | null;
  cuisineName: string | null;
  cuisineSlug: string | null;
  placeName: string | null;
  placeSlug: string | null;
}

export interface CulinaryPlace {
  id: string;
  slug: string;
  name: string;
  type: CulinaryPlaceType | null;
  description: string | null;
  locationHint: string | null;
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  socialUrl: string | null;
  coverUrl: string | null;
  operationalStatus: CulinaryOperationalStatus;
  publishStatus: CulinaryPublishStatus;
  restrictedReason: string | null;
  restrictedAt: string | null;
  managerId: string | null;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  cuisines?: CuisinePlaceLink[];
}

export type CulinaryContributionKind =
  | 'new_cuisine'
  | 'new_place'
  | 'link'
  | 'cuisine_edit'
  | 'place_edit'
  | 'link_edit'
  | 'place_operational'
  | 'archive'
  | 'restore';

export type CulinaryContributionStatus =
  | 'pending'
  | 'needs_revision'
  | 'approved'
  | 'rejected';

export interface CulinaryContribution {
  id: string;
  kind: CulinaryContributionKind;
  status: CulinaryContributionStatus;
  cuisineId: string | null;
  cuisineSlug: string | null;
  cuisineName: string | null;
  placeId: string | null;
  placeSlug: string | null;
  placeName: string | null;
  linkId: string | null;
  /** Field yang diajukan (dasar field-lock) - tampilkan sebagai diff. */
  fields: string[];
  payload: Record<string, unknown>;
  resultCuisineId: string | null;
  resultPlaceId: string | null;
  revisionNote: string | null;
  rejectReasonCode: string | null;
  rejectReasonText: string | null;
  createdAt: string;
  updatedAt: string | null;
  reviewedAt: string | null;
}

export type CulinaryClaimStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CulinaryClaim {
  id: string;
  placeId: string;
  placeSlug?: string;
  placeName?: string;
  note: string | null;
  status: CulinaryClaimStatus;
  rejectReasonCode: string | null;
  rejectReasonText: string | null;
  createdAt: string;
  reviewedAt: string | null;
  /** Hanya wire admin - bukti privat, jangan dirender di publik. */
  contactEvidence?: string;
  userId?: string;
  reviewedBy?: string | null;
}

export type CulinaryReportStatus = 'open' | 'resolved' | 'dismissed';

export interface CulinaryReport {
  id: string;
  targetType: 'cuisine' | 'place';
  targetId: string;
  targetSlug?: string | null;
  targetName?: string | null;
  reasonCode: string;
  note: string | null;
  status: CulinaryReportStatus;
  resolution: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CulinaryCategoryItem {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  sortOrder: number;
  createdAt: number;
  updatedAt: number | null;
}

/** Saran duplikat read-only - tidak pernah merge otomatis. */
export interface CulinaryDuplicateCandidate {
  id: string;
  slug: string;
  name: string;
}
