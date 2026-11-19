/** Batas kompresi foto sebelum upload (selaras mobile photo_pick_constants). */
export const PHOTO_UPLOAD_MAX_WIDTH = 720;
export const PHOTO_UPLOAD_MAX_HEIGHT = 720;
export const PHOTO_UPLOAD_QUALITY = 0.8;

/** Logo sponsor: cukup tajam di splash, tetap ringan. */
export const SPONSOR_LOGO_MAX_WIDTH = 512;
export const SPONSOR_LOGO_MAX_HEIGHT = 512;

export type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /**
   * true = encode PNG setelah resize (alpha dipertahankan).
   * false/default = WebP (foto biasa).
   */
  preserveAlpha?: boolean;
};

/**
 * Resize (tidak ada sisi > max) + encode.
 * - Default: WebP quality 80 (foto).
 * - `preserveAlpha: true`: PNG (logo transparan - jangan pakai JPEG/WebP lossy
 *   yang merusak alpha di sebagian alur).
 * File non-image atau gagal decode → dikembalikan apa adanya.
 */
export async function compressImageForUpload(
  file: File,
  opts: CompressImageOptions = {},
): Promise<File> {
  const maxWidth = opts.maxWidth ?? PHOTO_UPLOAD_MAX_WIDTH;
  const maxHeight = opts.maxHeight ?? PHOTO_UPLOAD_MAX_HEIGHT;
  const quality = opts.quality ?? PHOTO_UPLOAD_QUALITY;
  const preserveAlpha = opts.preserveAlpha === true;

  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  try {
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (
      !preserveAlpha &&
      scale >= 1 &&
      file.type === 'image/webp' &&
      file.size < 200_000
    ) {
      // Sudah kecil & dalam batas - skip re-encode
      return file;
    }

    if (
      preserveAlpha &&
      scale >= 1 &&
      file.type === 'image/png' &&
      file.size < 200_000
    ) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return file;
    // Jangan isi latar putih - biar alpha PNG/WebP sumber tetap kosong.
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const mime = preserveAlpha ? 'image/png' : 'image/webp';
    const blob = await new Promise<Blob | null>((resolve) =>
      preserveAlpha
        ? canvas.toBlob(resolve, mime)
        : canvas.toBlob(resolve, mime, quality),
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    const ext = preserveAlpha ? 'png' : 'webp';
    return new File([blob], `${baseName}.${ext}`, {
      type: mime,
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
