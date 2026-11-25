export type LemmaMergeStatus = 'pending' | 'approved' | 'rejected';

export const LEMMA_MERGE_STATUS_LABELS: Record<LemmaMergeStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export interface LemmaMergeListItem {
  id: string;
  status: LemmaMergeStatus;
  keep_word_id: string;
  keep_lemma: string;
  merge_word_ids: string[];
  merge_lemmas: string[];
  merge_count: number;
  reason_text: string | null;
  proposer_id: string;
  proposer_username: string | null;
  proposer_display_name: string;
  created_at: string;
}

export interface LemmaMergeWordRef {
  word_id: string;
  lemma: string;
}

export interface LemmaMergeDetail {
  id: string;
  status: LemmaMergeStatus;
  keep_word_id: string;
  keep_lemma: string;
  merge_words: LemmaMergeWordRef[];
  merge_word_ids: string[];
  reason_text: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  proposer_id: string;
  proposer_username: string | null;
  proposer_display_name: string;
  created_at: string;
}