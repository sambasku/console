export type PlaceCategoryStatus = 'draft' | 'published' | 'archived';

export interface PlaceCategoryItem {
  id: string;
  name: string;
  status: PlaceCategoryStatus;
  sortOrder: number;
  createdAt: number;
  updatedAt: number | null;
}
