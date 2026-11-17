import { client } from './client';

interface UploadCredentials {
  token: string;
  signature: string;
  expire: number;
  public_key: string;
  upload_endpoint: string;
}

/**
 * Unggah gambar ke CDN gambar (ImageKit) langsung dari browser.
 *
 * Pola sama dengan mobile (`ImageKitUploader`): backend hanya memberi
 * token + signature (`GET /admin/images/upload-token`), byte gambar
 * dikirim client langsung ke `upload_endpoint` - backend tidak
 * melewati byte gambar sama sekali.
 *
 * Validasi tipe/ukuran ada di sini (bukan di UI per-form) supaya semua
 * pemanggil kebagian guard yang sama; UI cukup menampilkan pesan.
 */
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export async function uploadImageToCdn(
  file: File,
  folder = '/uploads',
): Promise<{ url: string; fileId: string }> {
  if (!file.type.startsWith('image/')) throw new Error('File harus gambar');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Ukuran gambar maksimal 2 MB');

  const res = await client.get<{ success: true; data: UploadCredentials }>(
    '/admin/images/upload-token',
    { params: { folder } },
  );
  const creds = res.data.data;

  const form = new FormData();
  form.append('file', file, file.name);
  form.append('fileName', file.name);
  form.append('folder', folder);
  form.append('publicKey', creds.public_key);
  form.append('token', creds.token);
  form.append('expire', String(creds.expire));
  form.append('signature', creds.signature);

  const up = await fetch(creds.upload_endpoint, { method: 'POST', body: form });
  const rawText = await up.text();
  let data: { url?: string; fileId?: string; message?: string; help?: string } = {};
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    // body non-JSON
  }
  if (!up.ok) {
    const detail = data.message || data.help || rawText.slice(0, 200);
    throw new Error(
      detail
        ? `Unggah gambar gagal (HTTP ${up.status}): ${detail}`
        : `Unggah gambar gagal (HTTP ${up.status})`,
    );
  }
  if (!data.url || !data.fileId) throw new Error('Respons penyedia gambar tidak lengkap');
  return { url: data.url, fileId: data.fileId };
}
