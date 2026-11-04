/**
 * Domain types Ensiklopedia (console) - kontrak wire API:
 * - /api/v1/admin/encyclopedia/*
 * - /api/v1/encyclopedia/*
 * Semua timestamp = ISO string; pagination = { items, next_cursor, has_more }.
 */

export type ArticleStatus = 'draft' | 'published' | 'archived';
export type ContributionStatus = 'pending' | 'needs_revision' | 'approved' | 'rejected';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type ReportTargetType = 'article' | 'article_comment';

/** Cursor page envelope API. */
export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// ---- Payload ----

/** Payload artikel (create/update admin & usulan user) - snake_case. */
export interface ArticlePayload {
  title: string;
  excerpt: string;
  body_md: string;
  category_id: string;
  tags: string[];
  cover_url?: string | null;
  source_url?: string | null;
  references_md?: string | null;
}
export type ArticlePayloadValues = Partial<ArticlePayload>;

// ---- Artikel ----

/** Author reference (nullable saat akun dihapus). */
export interface ArticleAuthorRef {
  user_id: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verifier: boolean;
}

/** Item daftar artikel admin (toArticleWire / toArticleListItem). */
export interface AdminArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_url: string | null;
  category: { id: string; name: string };
  tags: string[];
  source_url: string | null;
  references_md: string | null;
  author: ArticleAuthorRef;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Detail artikel (extends list item + body_md). */
export interface AdminArticleDetail extends AdminArticleListItem {
  body_md: string;
}

// ---- Revisi ----

/** Revisi artikel (toRevisionWire). */
export interface ArticleRevision {
  id: string;
  article_id: string;
  editor_id: string;
  editor_username: string | null;
  contribution_id: string | null;
  title: string;
  excerpt: string;
  body_md: string;
  category_id: string;
  tags: string[];
  change_note: string | null;
  created_at: string;
}

// ---- Usulan ----

/** Referensi artikel di dalam usulan (nullable untuk kind=new). */
export interface ContributionArticleRef {
  id: string;
  slug: string | null;
  title: string | null;
}

/** Usulan artikel (toContributionWire). */
export interface ArticleContribution {
  id: string;
  kind: 'new' | 'edit';
  status: ContributionStatus;
  article: ContributionArticleRef | null;
  payload: ArticlePayload;
  base_updated_at: string | null;
  revision_note: string | null;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  result_article_id: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
}

/** Hasil review (sama seperti ArticleContribution penuh). */
export type ReviewDecisionResult = ArticleContribution;

// ---- Laporan ----

/** Wire type laporan (toReport). */
export interface ArticleReportListItem {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  user_id: string;
  username: string | null;
  reason_code: string;
  note: string | null;
  status: ReportStatus;
  resolution: 'dismissed' | 'taken_down' | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ---- Kategori & Tag ----

/** Kategori (toCategoryWire). */
export interface EncyclopediaCategoryItem {
  id: string;
  name: string;
  status: ArticleStatus;
  sort_order: number;
}

/** Tag (toTagWire). */
export interface EncyclopediaTagItem {
  id: string;
  slug: string;
  name: string;
}

// ---- Params ----

export interface ListAdminArticlesParams {
  status?: ArticleStatus;
  category_id?: string;
  q?: string;
  cursor?: string;
  limit?: number;
}

export interface ListAdminContributionsParams {
  status?: ContributionStatus;
  cursor?: string;
  limit?: number;
}

export interface ListAdminReportsParams {
  status?: ReportStatus;
  cursor?: string;
  limit?: number;
}

// ---- Constants ----

export const CONTRIBUTION_STATUS_LABEL: Record<ContributionStatus, string> = {
  pending: 'Menunggu',
  needs_revision: 'Perlu revisi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};
export const CONTRIBUTION_STATUS_COLOR: Record<ContributionStatus, string> = {
  pending: 'gold',
  needs_revision: 'orange',
  approved: 'green',
  rejected: 'red',
};
export const ARTICLE_STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: 'Draft',
  published: 'Tayang',
  archived: 'Diarsipkan',
};
export const ARTICLE_STATUS_COLOR: Record<ArticleStatus, string> = {
  draft: 'default',
  published: 'green',
  archived: 'red',
};
export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Terbuka',
  resolved: 'Selesai',
  dismissed: 'Diabaikan',
};
export const REPORT_STATUS_COLOR: Record<ReportStatus, string> = {
  open: 'gold',
  resolved: 'green',
  dismissed: 'default',
};
export const REPORT_REASON_LABEL: Record<string, string> = {
  spam: 'Spam',
  abusive: 'Kasar / menyerang',
  misinformation: 'Informasi menyesatkan',
  copyright: 'Pelanggaran hak cipta',
  private_info: 'Info pribadi',
  irrelevant: 'Tidak relevan',
  other: 'Lainnya',
};
export const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = {
  article: 'Artikel',
  article_comment: 'Komentar artikel',
};

export const ARTICLE_REPORT_REASONS = [
  'spam',
  'abusive',
  'misinformation',
  'copyright',
  'private_info',
  'irrelevant',
  'other',
] as const;
export type ArticleReportReason = (typeof ARTICLE_REPORT_REASONS)[number];