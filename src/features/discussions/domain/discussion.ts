export const DISCUSSION_STATUSES = [
  'pending_review',
  'published',
  'rejected',
  'taken_down',
] as const;

export type DiscussionStatus = (typeof DISCUSSION_STATUSES)[number];

export const DISCUSSION_STATUS_LABELS: Record<DiscussionStatus, string> = {
  pending_review: 'Menunggu',
  published: 'Tayang',
  rejected: 'Ditolak',
  taken_down: 'Ditarik',
};

export const DISCUSSION_STATUS_TAG_COLOR: Record<DiscussionStatus, string> = {
  pending_review: 'orange',
  published: 'green',
  rejected: 'red',
  taken_down: 'default',
};

export type DiscussionReplyStatus = 'published' | 'taken_down' | 'deleted_by_author';

export interface DiscussionImage {
  url: string;
  provider_file_id: string;
  public_url: string | null;
  /** Peringatan visual (mis. kekerasan). Default []. */
  content_warnings?: string[];
}

export interface DiscussionListItem {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  body: string | null;
  link_url: string | null;
  images: DiscussionImage[];
  status: DiscussionStatus;
  rejection_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  pinned_reply_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DiscussionReply {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  body: string | null;
  status: DiscussionReplyStatus;
  is_verifier: boolean;
  is_pinned: boolean;
  created_at: string;
  body_original: string | null;
  is_censored: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface DiscussionDetail extends DiscussionListItem {
  replies: DiscussionReply[];
}

export interface ListDiscussionsParams {
  status?: DiscussionStatus;
  limit?: number;
  cursor?: string;
}

/** URL preview admin: public_url jika sudah tayang, selain itu url staging (ImageKit). */
export function previewImageUrl(img: DiscussionImage): string {
  return img.public_url || img.url;
}
