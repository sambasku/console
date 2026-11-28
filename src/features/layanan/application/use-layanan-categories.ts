import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/api/client';

export type LayananCategoryStatus = 'published' | 'archived';

export interface LayananCategoryItem {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  status: LayananCategoryStatus;
  sortOrder: number;
  createdAt: number;
  updatedAt: number | null;
}

interface Wire {
  id: string;
  name: string;
  short_label: string;
  icon: string;
  status: LayananCategoryStatus;
  sort_order: number;
  created_at: number;
  updated_at: number | null;
}

export const LAYANAN_CATEGORY_ICON_OPTIONS = [
  { value: 'ambulance', label: 'Ambulans' },
  { value: 'flame', label: 'Api (pemadam)' },
  { value: 'cross', label: 'Salib (kesehatan)' },
  { value: 'siren', label: 'Sirene (umum)' },
];

function mapItem(w: Wire): LayananCategoryItem {
  return {
    id: w.id,
    name: w.name,
    shortLabel: w.short_label,
    icon: w.icon,
    status: w.status,
    sortOrder: w.sort_order,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export interface LayananCategoryInput {
  id: string;
  name: string;
  short_label: string;
  icon?: string;
  status?: LayananCategoryStatus;
  sort_order?: number;
}

export async function listLayananCategoryItemsRequest(signal?: AbortSignal): Promise<LayananCategoryItem[]> {
  const res = await client.get<{ success: true; data: { items: Wire[] } }>('/admin/layanan-categories', {
    signal,
  });
  return res.data.data.items.map(mapItem);
}

export async function createLayananCategoryItemRequest(body: LayananCategoryInput): Promise<LayananCategoryItem> {
  const res = await client.post<{ success: true; data: Wire }>('/admin/layanan-categories', body);
  return mapItem(res.data.data);
}

export async function updateLayananCategoryItemRequest(
  id: string,
  body: Partial<Omit<LayananCategoryInput, 'id'>>,
): Promise<LayananCategoryItem> {
  const res = await client.patch<{ success: true; data: Wire }>('/admin/layanan-categories/by-id', body, {
    params: { id },
  });
  return mapItem(res.data.data);
}

export async function deleteLayananCategoryItemRequest(id: string): Promise<void> {
  await client.delete('/admin/layanan-categories/by-id', { params: { id } });
}

const QUERY_KEY = ['layanan-category-items'];

/** Semua kategori (termasuk arsip). Dipakai halaman kelola dan label di tabel/drawer. */
export function useAllLayananCategoryItems(enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'all'],
    queryFn: ({ signal }) => listLayananCategoryItemsRequest(signal),
    enabled,
    staleTime: 60_000,
  });
}

/** Peta id -> kategori untuk label. Kategori belum termuat: fallback ke slug mentah di pemanggil. */
export function useLayananCategoryMap(enabled = true) {
  const query = useAllLayananCategoryItems(enabled);
  const map = useMemo(
    () => Object.fromEntries((query.data ?? []).map((c) => [c.id, c])),
    [query.data],
  );
  return { map, isLoading: query.isLoading };
}

export function useCreateLayananCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLayananCategoryItemRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateLayananCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<Omit<LayananCategoryInput, 'id'>>) =>
      updateLayananCategoryItemRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteLayananCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLayananCategoryItemRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
