import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import { compressImageForUpload } from '@/shared/utils/compress-image';
import type { Sticker, StickerInput, StickerPatch } from '../domain/sticker';

export async function listAdminStickers(signal?: AbortSignal): Promise<Sticker[]> {
  const res = await client.get<ApiOkEnvelope<Sticker[]>>('/admin/stickers', {
    signal,
  });
  return res.data.data;
}

export async function createSticker(body: StickerInput): Promise<Sticker> {
  const res = await client.post<ApiOkEnvelope<Sticker>>('/admin/stickers', body);
  return res.data.data;
}

export async function updateSticker(
  id: string,
  body: StickerPatch,
): Promise<Sticker> {
  const res = await client.patch<ApiOkEnvelope<Sticker>>(
    `/admin/stickers/${encodeURIComponent(id)}`,
    body,
  );
  return res.data.data;
}

export async function deleteSticker(id: string): Promise<void> {
  await client.delete(`/admin/stickers/${encodeURIComponent(id)}`);
}

/** Upload ke repo images via API (purpose=sticker, boleh GIF). */
export async function uploadStickerImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ url: string }> {
  const isGif =
    file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
  const toSend = isGif ? file : await compressImageForUpload(file);
  const maxBytes = 5 * 1024 * 1024;
  if (toSend.size > maxBytes) {
    throw new Error('Gambar masih terlalu besar (maks 5 MB)');
  }
  const form = new FormData();
  form.append('file', toSend);
  const res = await client.post<
    ApiOkEnvelope<{
      url: string;
      provider: string;
      provider_file_id: string;
      sha: string;
    }>
  >('/images?purpose=sticker', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return { url: res.data.data.url };
}
