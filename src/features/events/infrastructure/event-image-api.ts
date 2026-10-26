import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import { compressImageForUpload } from '@/shared/utils/compress-image';

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload poster acara ke POST /images?purpose=event (kompres sama seperti foto lain). */
export async function uploadEventPoster(file: File): Promise<string> {
  const compressed = await compressImageForUpload(file);
  if (compressed.size > MAX_BYTES) {
    throw new Error('Gambar masih terlalu besar setelah dikompresi (maks 5 MB)');
  }
  const form = new FormData();
  form.append('file', compressed);
  const res = await client.post<ApiOkEnvelope<{ url: string }>>(
    '/images?purpose=event',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data.url;
}
