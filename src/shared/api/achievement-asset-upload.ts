import { client } from './client';

interface UploadCredentials {
  token: string;
  signature: string;
  expire: number;
  public_key: string;
  upload_endpoint: string;
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

async function postToCdn(file: File, folder: string): Promise<{ url: string; fileId: string }> {
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
        ? `Unggah aset gagal (HTTP ${up.status}): ${detail}`
        : `Unggah aset gagal (HTTP ${up.status})`,
    );
  }
  if (!data.url || !data.fileId) throw new Error('Respons penyedia gambar tidak lengkap');
  return { url: data.url, fileId: data.fileId };
}

/** Border statis (PNG/WebP) atau animasi Lottie (.json / .lottie). */
export async function uploadAchievementAssetToCdn(
  file: File,
  folder = '/achievements',
): Promise<{ url: string; fileId: string }> {
  const name = file.name.toLowerCase();
  const okImage = file.type.startsWith('image/');
  const okJson = file.type === 'application/json' || name.endsWith('.json');
  const okLottie = name.endsWith('.lottie') || file.type === 'application/octet-stream';
  if (!okImage && !okJson && !okLottie) {
    throw new Error('File harus gambar, Lottie JSON, atau .lottie');
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Ukuran aset maksimal 2 MB');
  return postToCdn(file, folder);
}

export { uploadImageToCdn } from './image-upload';