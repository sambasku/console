/** Buka detail kata di tab baru supaya halaman laporan tetap terbuka. */
export function openWordDetail(wordId: string) {
  window.open(`/words/${wordId}`, '_blank', 'noopener,noreferrer');
}
