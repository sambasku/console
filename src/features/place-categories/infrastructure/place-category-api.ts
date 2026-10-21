import { client } from '@/shared/api/client';
import type { PlaceCategoryItem, PlaceCategoryStatus } from '../domain/place-category';

interface Wire {
  id: string;
  name: string;
  status: PlaceCategoryStatus;
  sort_order: number;
  created_at: number;
  updated_at: number | null;
}

function mapItem(w: Wire): PlaceCategoryItem {
  return {
    id: w.id,
    name: w.name,
    status: w.status,
    sortOrder: w.sort_order,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export async function listPlaceCategoriesRequest(
  params: { limit?: number; before?: string; q?: string; status?: PlaceCategoryStatus } = {},
  signal?: AbortSignal,
): Promise<{ items: PlaceCategoryItem[]; nextCursor: string | null }> {
  const res = await client.get<{
    success: true;
    data: { items: Wire[]; next_cursor: string | null };
  }>('/admin/place-categories', { params, signal });
  return {
    items: res.data.data.items.map(mapItem),
    nextCursor: res.data.data.next_cursor,
  };
}

export async function listAllPlaceCategoriesRequest(
  params: { q?: string; status?: PlaceCategoryStatus } = {},
  signal?: AbortSignal,
): Promise<PlaceCategoryItem[]> {
  const items: PlaceCategoryItem[] = [];
  let before: string | undefined;
  for (;;) {
    const page = await listPlaceCategoriesRequest({ ...params, limit: 50, before }, signal);
    items.push(...page.items);
    if (!page.nextCursor) break;
    before = page.nextCursor;
  }
  return items;
}

export type PlaceCategoryInput = {
  id: string;
  name: string;
  status?: PlaceCategoryStatus;
  sort_order?: number;
};

export async function createPlaceCategoryRequest(body: PlaceCategoryInput): Promise<PlaceCategoryItem> {
  const res = await client.post<{ success: true; data: Wire }>('/admin/place-categories', body);
  return mapItem(res.data.data);
}

export async function updatePlaceCategoryRequest(
  id: string,
  body: Partial<Omit<PlaceCategoryInput, 'id'>>,
): Promise<PlaceCategoryItem> {
  const res = await client.patch<{ success: true; data: Wire }>(
    '/admin/place-categories/by-id',
    body,
    { params: { id } },
  );
  return mapItem(res.data.data);
}

export async function deletePlaceCategoryRequest(id: string): Promise<void> {
  await client.delete('/admin/place-categories/by-id', { params: { id } });
}
