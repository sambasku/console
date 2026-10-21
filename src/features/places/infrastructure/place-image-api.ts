import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import { compressImageForUpload } from '@/shared/utils/compress-image';

/** Upload satu foto place ke POST /images?purpose=place (GitHub → jsDelivr). */
export async function uploadPlaceImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const compressed = await compressImageForUpload(file);
  const maxBytes = 5 * 1024 * 1024;
  if (compressed.size > maxBytes) {
    throw new Error('Gambar masih terlalu besar setelah dikompresi (maks 5 MB)');
  }
  const form = new FormData();
  form.append('file', compressed);

  const res = await client.post<ApiOkEnvelope<{ url: string }>>(
    '/images?purpose=place',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    },
  );

  return res.data.data.url;
}
