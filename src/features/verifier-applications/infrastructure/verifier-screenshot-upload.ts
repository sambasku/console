import axios from 'axios';
import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import { compressImageForUpload } from '@/shared/utils/compress-image';

/**
 * Upload screenshot pengajuan verifikator ke ImageKit (folder privat).
 * Token dari GET /admin/images/upload-token, lalu direct upload dari browser
 * (byte gambar tidak lewat API worker). Mirror imagekit_uploader.dart.
 */
export async function uploadVerifierScreenshot(
  file: File,
): Promise<{ url: string; providerFileId: string }> {
  const compressed = await compressImageForUpload(file);
  const maxBytes = 5 * 1024 * 1024;
  if (compressed.size > maxBytes) {
    throw new Error('Gambar masih terlalu besar setelah dikompresi (maks 5 MB)');
  }

  const creds = await client.get<
    ApiOkEnvelope<{
      token: string;
      signature: string;
      expire: number;
      public_key: string;
      upload_endpoint: string;
    }>
  >('/admin/images/upload-token', { params: { folder: '/verifier-applications' } });
  const c = creds.data.data;

  const form = new FormData();
  form.append('file', compressed);
  form.append('fileName', file.name || 'screenshot.jpg');
  form.append('folder', '/verifier-applications');
  form.append('publicKey', c.public_key);
  form.append('token', c.token);
  form.append('expire', String(c.expire));
  form.append('signature', c.signature);

  // Axios polos: endpoint ImageKit eksternal, tanpa auth interceptor API.
  const res = await axios.post<{ url: string; fileId: string }>(c.upload_endpoint, form);
  const { url, fileId } = res.data;
  if (!url || !fileId) throw new Error('Respons ImageKit tidak lengkap');
  return { url, providerFileId: fileId };
}
