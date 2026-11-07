/** Item GET /api/v1/admin/words/:wordId/voters (snake_case wire). */
export interface WordVoterWire {
  id: string;
  voter_id: string;
  voter_username: string;
  voter_display_name: string | null;
  voter_avatar_url: string | null;
  voter_email: string;
  meaning_id: string;
  meaning_preview: string | null;
  value: 1 | -1;
  created_at: string;
}

export interface WordVoterListItem {
  id: string;
  voterId: string;
  voterUsername: string;
  voterDisplayName: string | null;
  voterEmail: string;
  meaningId: string;
  meaningPreview: string | null;
  value: 1 | -1;
  createdAt: string;
}

export interface WordVotersMeta {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
  upvotes: number;
  downvotes: number;
}

export interface WordMeaningOption {
  id: string;
  label: string;
}

export function normalizeWordVoter(wire: WordVoterWire): WordVoterListItem {
  return {
    id: wire.id,
    voterId: wire.voter_id,
    voterUsername: wire.voter_username,
    voterDisplayName: wire.voter_display_name,
    voterEmail: wire.voter_email,
    meaningId: wire.meaning_id,
    meaningPreview: wire.meaning_preview,
    value: wire.value,
    createdAt: wire.created_at,
  };
}
