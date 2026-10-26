import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/api/client';
import type { UsahaCategoryItem } from '../domain/usaha';

interface Wire {
  id: string;
  name: string;
  status: UsahaCategoryItem['status'];
  sort_order: number;
  created_at: number;
  updated_at: number | null;
}

function mapItem(w: Wire): UsahaCategoryItem {
  return {
    id: w.id,
    name: w.name,
    status: w.status,
    sortOrder: w.sort_order,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export async function listUsahaCategoryItemsRequest(
  params: { q?: string } = {},
  signal?: AbortSignal,
): Promise<UsahaCategoryItem[]> {
  const res = await client.get<{
    success: true;
    data: { items: Wire[]; next_cursor: string | null };
  }>('/admin/usaha-categories', { params: { ...params, limit: 200 }, signal });
  return res.data.data.items.map(mapItem);
}

export interface UsahaCategoryInput {
  id: string;
  name: string;
  status?: UsahaCategoryItem['status'];
  sort_order?: number;
}

export async function createUsahaCategoryItemRequest(
  body: UsahaCategoryInput,
): Promise<UsahaCategoryItem> {
  const res = await client.post<{ success: true; data: Wire }>(
    '/admin/usaha-categories',
    body,
  );
  return mapItem(res.data.data);
}

export async function updateUsahaCategoryItemRequest(
  id: string,
  body: Partial<Omit<UsahaCategoryInput, 'id'>>,
): Promise<UsahaCategoryItem> {
  const res = await client.patch<{ success: true; data: Wire }>(
    '/admin/usaha-categories/by-id',
    body,
    { params: { id } },
  );
  return mapItem(res.data.data);
}

export async function deleteUsahaCategoryItemRequest(id: string): Promise<void> {
  await client.delete('/admin/usaha-categories/by-id', { params: { id } });
}

export function useAllUsahaCategoryItems(enabled = true) {
  return useQuery({
    queryKey: ['usaha-category-items', 'all'],
    queryFn: ({ signal }) => listUsahaCategoryItemsRequest({}, signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateUsahaCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUsahaCategoryItemRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha-category-items'] }),
  });
}

export function useUpdateUsahaCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & Partial<Omit<UsahaCategoryInput, 'id'>>) =>
      updateUsahaCategoryItemRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha-category-items'] }),
  });
}

export function useDeleteUsahaCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUsahaCategoryItemRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usaha-category-items'] }),
  });
}
