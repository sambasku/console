import { client } from './client';

interface UploadCredentials {
  token: string;
  signature: string;
  expire: number;
  public_key: string;
  upload_endpoint: string;
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function looksLikeZip(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  );
}

function looksLikeJsonText(bytes: Uint8Array): boolean {
  const sample = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 512));
  const t = sample.trimStart();
  return t.startsWith('{') || t.startsWith('[');
}

/** Deteksi nama/MIME + sniff awal file (macOS sering kosongkan MIME). */
export async function isLottieAssetFile(file: File): Promise<boolean> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json') || name.endsWith('.lottie')) return true;
  if (file.type === 'application/json' || file.type === 'text/json') return true;
  if (file.type.startsWith('image/')) return false;

  const head = file.slice(0, Math.min(file.size, 4096));
  const bytes = new Uint8Array(await head.arrayBuffer());
  if (looksLikeZip(bytes)) return true;
  if (looksLikeJsonText(bytes)) return true;
  return false;
}

/** Lottie border → repo GitHub (jsDelivr). Jangan lewat ImageKit. */
export async function uploadAchievementLottieToGithub(
  file: File,
): Promise<{ url: string; fileId: string }> {
  const form = new FormData();
  form.append('file', file, file.name);
  const res = await client.post<
    {
      success: true;
      data: { url: string; provider: string; provider_file_id: string; sha: string };
    }
  >('/images?purpose=achievement', form);
  const url = res.data.data.url;
  if (url.includes('imagekit.io')) {
    throw new Error(
      'Respons upload salah (ImageKit). Pastikan API staging punya purpose=achievement.',
    );
  }
  return {
    url,
    fileId: res.data.data.provider_file_id,
  };
}

async function postToImageKit(file: File, folder: string): Promise<{ url: string; fileId: string }> {
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

/** Border statis (PNG/WebP) ke ImageKit; animasi Lottie ke repo GitHub. */
export async function uploadAchievementAssetToCdn(
  file: File,
  folder = '/achievements',
  assetKind: 'image' | 'lottie' = 'image',
): Promise<{ url: string; fileId: string }> {
  const name = file.name.toLowerCase();
  const okImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name);
  const fileIsLottie = await isLottieAssetFile(file);

  if (!okImage && !fileIsLottie && assetKind !== 'lottie') {
    throw new Error('File harus gambar, Lottie JSON, atau .lottie');
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Ukuran aset maksimal 2 MB');

  if (assetKind === 'lottie' || fileIsLottie) {
    if (!fileIsLottie) {
      throw new Error('Jenis aset Lottie: file harus JSON Bodymovin atau .lottie');
    }
    return uploadAchievementLottieToGithub(file);
  }

  if (!okImage) {
    throw new Error('Untuk border gambar, pilih PNG/WebP atau ubah jenis aset ke Lottie');
  }
  return postToImageKit(file, folder);
}

export { uploadImageToCdn } from './image-upload';
