import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/api/client';
import type { CulinaryCategoryItem } from '../domain/culinary';

interface Wire {
  id: string;
  name: string;
  status: CulinaryCategoryItem['status'];
  sort_order: number;
  created_at: number;
  updated_at: number | null;
}

function mapItem(w: Wire): CulinaryCategoryItem {
  return {
    id: w.id,
    name: w.name,
    status: w.status,
    sortOrder: w.sort_order,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export async function listCulinaryCategoryItemsRequest(
  params: { q?: string } = {},
  signal?: AbortSignal,
): Promise<CulinaryCategoryItem[]> {
  const res = await client.get<{
    success: true;
    data: { items: Wire[]; next_cursor: string | null };
  }>('/admin/culinary-categories', { params: { ...params, limit: 200 }, signal });
  return res.data.data.items.map(mapItem);
}

export interface CulinaryCategoryInput {
  id: string;
  name: string;
  status?: CulinaryCategoryItem['status'];
  sort_order?: number;
}

export async function createCulinaryCategoryItemRequest(
  body: CulinaryCategoryInput,
): Promise<CulinaryCategoryItem> {
  const res = await client.post<{ success: true; data: Wire }>(
    '/admin/culinary-categories',
    body,
  );
  return mapItem(res.data.data);
}

export async function updateCulinaryCategoryItemRequest(
  id: string,
  body: Partial<Omit<CulinaryCategoryInput, 'id'>>,
): Promise<CulinaryCategoryItem> {
  const res = await client.patch<{ success: true; data: Wire }>(
    '/admin/culinary-categories/by-id',
    body,
    { params: { id } },
  );
  return mapItem(res.data.data);
}

export async function deleteCulinaryCategoryItemRequest(id: string): Promise<void> {
  await client.delete('/admin/culinary-categories/by-id', { params: { id } });
}

export function useAllCulinaryCategoryItems(enabled = true) {
  return useQuery({
    queryKey: ['culinary-category-items', 'all'],
    queryFn: ({ signal }) => listCulinaryCategoryItemsRequest({}, signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateCulinaryCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCulinaryCategoryItemRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary-category-items'] }),
  });
}

export function useUpdateCulinaryCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & Partial<Omit<CulinaryCategoryInput, 'id'>>) =>
      updateCulinaryCategoryItemRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary-category-items'] }),
  });
}

export function useDeleteCulinaryCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCulinaryCategoryItemRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culinary-category-items'] }),
  });
}
