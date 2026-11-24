import { client } from "@/shared/api/client";
import type {
  CommunityCategory,
  CommunityFeaturedKind,
  CommunityOrg,
  CommunityProposal,
  CommunityProposalStatus,
  CommunityPublishStatus,
} from "../domain/community";

interface CommunityOrgWire {
  id: string;
  slug: string;
  name: string;
  category: CommunityCategory;
  description: string;
  logo_url: string | null;
  cover_url: string | null;
  status: CommunityPublishStatus;
  is_featured_kind: CommunityFeaturedKind | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CommunityProposalWire {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  category: CommunityCategory;
  status: CommunityProposalStatus;
  review_note: string | null;
  community_org_id: string | null;
  username: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

export interface CommunityOrgInput {
  name: string;
  category: CommunityCategory;
  description: string;
  logo_url?: string | null;
  cover_url?: string | null;
  is_featured_kind?: CommunityFeaturedKind | null;
}

export interface CommunityProposalApproveInput {
  category?: CommunityCategory;
  name?: string;
  description?: string;
  logo_url?: string | null;
  is_featured_kind?: CommunityFeaturedKind | null;
}

export const COMMUNITY_CATEGORY_OPTIONS: Array<{
  value: CommunityCategory;
  label: string;
}> = [
  { value: "seni", label: "Seni" },
  { value: "bahasa", label: "Bahasa" },
  { value: "pendidikan", label: "Pendidikan" },
  { value: "ukm", label: "UKM" },
  { value: "lain", label: "Lainnya" },
];

export const COMMUNITY_FEATURED_OPTIONS: Array<{
  value: CommunityFeaturedKind;
  label: string;
}> = [
  { value: "tim", label: "Tim" },
  { value: "sponsor", label: "Sponsor" },
];

export const COMMUNITY_STATUS_LABEL: Record<CommunityPublishStatus, string> = {
  published: "Tayang",
  archived: "Diarsipkan",
};

export const COMMUNITY_PROPOSAL_STATUS_LABEL: Record<
  CommunityProposalStatus,
  string
> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

export function mapCommunityOrg(w: CommunityOrgWire): CommunityOrg {
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    category: w.category,
    description: w.description,
    logoUrl: w.logo_url,
    coverUrl: w.cover_url,
    status: w.status,
    isFeaturedKind: w.is_featured_kind,
    authorId: w.author_id,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export function mapCommunityProposal(
  w: CommunityProposalWire,
): CommunityProposal {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    logoUrl: w.logo_url,
    category: w.category,
    status: w.status,
    reviewNote: w.review_note,
    communityOrgId: w.community_org_id,
    username: w.username,
    userId: w.user_id,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    reviewedAt: w.reviewed_at,
  };
}

export async function listCommunityOrgsRequest(
  signal?: AbortSignal,
): Promise<CommunityOrg[]> {
  const res = await client.get<{
    success: true;
    data: { items: CommunityOrgWire[] };
  }>("/admin/community/orgs", { signal });
  return res.data.data.items.map(mapCommunityOrg);
}

export async function createCommunityOrgRequest(
  body: CommunityOrgInput,
): Promise<CommunityOrg> {
  const res = await client.post<{ success: true; data: CommunityOrgWire }>(
    "/admin/community/orgs",
    body,
  );
  return mapCommunityOrg(res.data.data);
}

export async function updateCommunityOrgRequest(
  id: string,
  body: Partial<CommunityOrgInput>,
): Promise<CommunityOrg> {
  const res = await client.put<{ success: true; data: CommunityOrgWire }>(
    `/admin/community/orgs/${id}`,
    body,
  );
  return mapCommunityOrg(res.data.data);
}

export async function setCommunityOrgStatusRequest(
  id: string,
  status: CommunityPublishStatus,
): Promise<void> {
  await client.post(`/admin/community/orgs/${id}/status`, { status });
}

export async function listCommunityProposalsRequest(
  params: { status?: CommunityProposalStatus } = {},
  signal?: AbortSignal,
): Promise<CommunityProposal[]> {
  const res = await client.get<{
    success: true;
    data: { items: CommunityProposalWire[] };
  }>("/admin/community-proposals", { params, signal });
  return res.data.data.items.map(mapCommunityProposal);
}

export async function approveCommunityProposalRequest(
  id: string,
  body: CommunityProposalApproveInput = {},
): Promise<CommunityOrg> {
  const res = await client.post<{ success: true; data: CommunityOrgWire }>(
    `/admin/community-proposals/${id}/approve`,
    body,
  );
  return mapCommunityOrg(res.data.data);
}

export async function rejectCommunityProposalRequest(
  id: string,
  body: { note?: string | null } = {},
): Promise<void> {
  await client.post(`/admin/community-proposals/${id}/reject`, body);
}
