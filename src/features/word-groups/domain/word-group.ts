// PRD relasi-lemma: kelompok makna. Wire: camelCase hasil map dari
// kontrak API /api/v1/word-groups (lihat word-group.validator.ts).
export type WordGroupStatus = 'pending_review' | 'published' | 'rejected';

export interface WordGroupMember {
  /** id baris keanggotaan (bukan word id) - dipakai hapus. */
  id: string;
  wordId: string;
  lemma: string;
  notes: string | null;
  status: WordGroupStatus;
}

export interface WordGroupItem {
  id: string;
  name: string;
  description: string | null;
  status: WordGroupStatus;
  isVerified: boolean;
  members: WordGroupMember[];
}

export interface WordGroupInput {
  name: string;
  description?: string | null;
  status?: WordGroupStatus;
}

export const WORD_GROUP_STATUS_LABELS: Record<WordGroupStatus, string> = {
  pending_review: 'Menunggu review',
  published: 'Tayang',
  rejected: 'Ditolak',
};
