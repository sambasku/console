/** Domain usul perubahan kata . */

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'corrected';

export type SuggestionReasonCode =
  | 'change_meaning'
  | 'change_word_class'
  | 'add_meaning'
  | 'add_photo'
  | 'change_photo'
  | 'synonym'
  | 'antonym'
  | 'variant_of'
  | 'nonstandard_of'
  | 'derived_from'
  | 'meaning_group'
  | 'spelling_variant'
  | 'lemma_notes'
  | 'typo'
  | 'inaccurate_definition'
  | 'missing_example'
  | 'missing_relation'
  | 'image_issue'
  | 'other';

export interface SuggestionListItem {
  id: string;
  word_id: string;
  word_lemma: string;
  contributor_id: string;
  contributor_username: string | null;
  contributor_display_name: string | null;
  reason: string;
  reason_code: SuggestionReasonCode;
  status: SuggestionStatus;
  created_at: string;
  summary_changes: {
    lemma: string | null;
    notes: string | null;
    meanings_count: number;
    categories_added: number;
    categories_removed: number;
    relations_count: number;
    variants_count: number;
    images_count: number;
    groups_count: number;
  };
}

export interface SuggestionDetail {
  suggestion: {
    id: string;
    word_id: string;
    word_lemma: string;
    contributor_id: string;
    contributor_username: string | null;
    contributor_display_name: string | null;
    reason: string;
    reason_code: SuggestionReasonCode;
    proposed_changes: Record<string, unknown>;
    status: SuggestionStatus;
    created_at: string;
  };
  current_word: {
    lemma: string;
    notes: string | null;
    word_type: string;
    meanings: Array<{
      id: string;
      word_class: { code: string; name: string } | null;
      definition: string;
      translations: Array<{ translation_text: string }>;
    }>;
    category_ids: string[];
    relations: Array<{ relation_type: string; word_id: string; lemma: string }>;
    variants: Array<{ form: string; variant_type: string; dialect_id: string | null }>;
    images: Array<{ id: string; url: string; is_primary: boolean; alt_text: string | null }>;
    groups?: Array<{ group_id: string; name: string; member_word_ids: string[] }>;
  };
  diff: {
    lemma: { current: string | null; proposed: string | null; changed: boolean };
    notes: { current: string | null; proposed: string | null; changed: boolean };
    word_type: { current: string | null; proposed: string | null; changed: boolean };
    meanings: Array<{
      meaning_id: string | null;
      changes: Array<{ current: string | null; proposed: string | null; changed: boolean }>;
    }>;
    categories: { added: string[]; removed: string[] };
    relations: {
      added: Array<{
        relation_type: string;
        word_id?: string;
        lemma?: string;
        /** Target belum ada di kamus - dibuat sebagai kata baru saat approve. */
        new_word?: boolean;
      }>;
      removed: Array<{ relation_type: string; word_id: string; lemma?: string }>;
    };
    variants: {
      added: Array<{ form: string; variant_type: string }>;
      removed: Array<{ form: string; variant_type: string }>;
    };
    groups?: {
      joined: Array<{ group_id: string; name: string }>;
      left: Array<{ group_id: string; name: string }>;
      created: Array<{ name: string; member_lemmas: string[]; new_word_lemmas?: string[] }>;
    };
    images: {
      added: Array<{
        url: string;
        is_primary: boolean;
        provider?: string | null;
        provider_file_id?: string | null;
      }>;
      removed: Array<{ image_id: string }>;
      set_primary: Array<{ image_id: string }>;
    };
  };
}

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  corrected: 'Dikoreksi',
};

export const REASON_CODE_LABELS: Record<SuggestionReasonCode, string> = {
  change_meaning: 'Ubah makna',
  change_word_class: 'Ubah kelas kata',
  add_meaning: 'Tambah makna',
  add_photo: 'Tambah foto',
  change_photo: 'Ubah foto',
  synonym: 'Sinonim',
  antonym: 'Antonim',
  variant_of: 'Variasi bentuk',
  nonstandard_of: 'Bentuk tidak baku',
  derived_from: 'Kata turunan',
  meaning_group: 'Kelompok makna',
  spelling_variant: 'Variasi penulisan',
  lemma_notes: 'Lemma atau catatan',
  typo: 'Kesalahan penulisan',
  inaccurate_definition: 'Definisi kurang tepat',
  missing_example: 'Kurang contoh',
  missing_relation: 'Relasi/sinonim kurang',
  image_issue: 'Gambar kurang/salah',
  other: 'Lainnya',
};
