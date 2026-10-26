export type SearchMissDirection = 'lemma' | 'translation';
export type SearchMissStatusKey = 'pending' | 'fulfilled' | 'dismissed';

export interface SearchMissListItem {
  id: string;
  term: string;
  direction: SearchMissDirection;
  searchCount: number;
  fulfilled: boolean;
  /**
   * Jumlah usulan kata baru yang menaut miss ini dan masih menunggu review.
   * >0 berarti verifikator sebaiknya review usulan dulu, bukan buat kata dobel.
   */
  pendingContributionCount: number;
  /** Id usulan pending tertua - dipakai untuk deep link ke antrean review. */
  pendingContributionId: string | null;
  isVisible: boolean;
  createdAt: string;
}

export const DIRECTION_LABELS: Record<SearchMissDirection, string> = {
  lemma: 'Lemma (Kata)',
  translation: 'Terjemahan',
};

export const DIRECTION_TAG_COLOR: Record<SearchMissDirection, string> = {
  lemma: 'blue',
  translation: 'purple',
};
