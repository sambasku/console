import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StickerInput, StickerPatch } from '../domain/sticker';
import {
  createSticker,
  deleteSticker,
  listAdminStickers,
  updateSticker,
} from '../infrastructure/sticker-api';

export function useStickerList(enabled = true) {
  return useQuery({
    queryKey: ['admin-stickers'],
    queryFn: ({ signal }) => listAdminStickers(signal),
    enabled,
  });
}

export function useCreateSticker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSticker,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-stickers'] }),
  });
}

export function useUpdateSticker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & StickerPatch) =>
      updateSticker(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-stickers'] }),
  });
}

export function useDeleteSticker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSticker,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-stickers'] }),
  });
}

export type { StickerInput, StickerPatch };
