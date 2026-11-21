export interface Sticker {
  id: string;
  image_url: string;
  play_once: boolean;
  sort_order: number;
  is_active: boolean;
  category_slug: string | null;
}

export interface StickerInput {
  id: string;
  image_url: string;
  play_once?: boolean;
  sort_order?: number;
  is_active?: boolean;
  category_slug?: string | null;
}

export type StickerPatch = Partial<Omit<StickerInput, 'id'>>;
