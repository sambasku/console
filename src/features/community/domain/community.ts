export type CommunityCategory =
  "seni" | "bahasa" | "pendidikan" | "ukm" | "lain";

export type CommunityFeaturedKind = "tim" | "sponsor";

export type CommunityPublishStatus = "published" | "archived";

export type CommunityProposalStatus =
  "pending" | "approved" | "rejected" | "cancelled";

export interface CommunityOrg {
  id: string;
  slug: string;
  name: string;
  category: CommunityCategory;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  status: CommunityPublishStatus;
  isFeaturedKind: CommunityFeaturedKind | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityProposal {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  category: CommunityCategory;
  status: CommunityProposalStatus;
  reviewNote: string | null;
  communityOrgId: string | null;
  username: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}
