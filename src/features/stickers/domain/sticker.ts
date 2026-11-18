export interface Sticker {
  id: string;
  image_url: string;
  play_once: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface StickerInput {
  id: string;
  image_url: string;
  play_once?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

export type StickerPatch = Partial<Omit<StickerInput, 'id'>>;
