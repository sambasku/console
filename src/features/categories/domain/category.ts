/** Kategori master (admin console) — mirror dari API response. */
export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  word_count: number;
}