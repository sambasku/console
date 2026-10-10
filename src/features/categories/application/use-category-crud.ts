import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { Category } from '../domain/category';

export type CategoryInput = {
  name: string;
  description?: string | null;
  parent_id?: string | null;
};

export async function listCategoriesRequest(signal?: AbortSignal): Promise<Category[]> {
  const res = await client.get<ApiOkEnvelope<Category[]>>('/categories', { signal });
  return res.data.data;
}

export async function createCategoryRequest(body: CategoryInput): Promise<Category> {
  const res = await client.post<ApiOkEnvelope<Category>>('/categories', body);
  return res.data.data;
}

export async function updateCategoryRequest(id: string, body: Partial<CategoryInput>): Promise<Category> {
  const res = await client.put<ApiOkEnvelope<Category>>(`/categories/${id}`, body);
  return res.data.data;
}

export async function deleteCategoryRequest(id: string): Promise<void> {
  await client.delete(`/categories/${id}`);
}

export function useCategoryList(enabled = true) {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => listCategoriesRequest(signal),
    enabled,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategoryRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<CategoryInput>) => updateCategoryRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategoryRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}