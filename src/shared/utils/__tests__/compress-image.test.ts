import { describe, expect, it, vi } from 'vitest';
import {
  PHOTO_UPLOAD_MAX_HEIGHT,
  PHOTO_UPLOAD_MAX_WIDTH,
  PHOTO_UPLOAD_QUALITY,
  compressImageForUpload,
} from '../compress-image';

describe('compress-image constants', () => {
  it('selaras spek mobile 720 / 0.8 (output WebP)', () => {
    expect(PHOTO_UPLOAD_MAX_WIDTH).toBe(720);
    expect(PHOTO_UPLOAD_MAX_HEIGHT).toBe(720);
    expect(PHOTO_UPLOAD_QUALITY).toBe(0.8);
  });
});

describe('compressImageForUpload', () => {
  it('non-image dikembalikan apa adanya', async () => {
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    const out = await compressImageForUpload(file);
    expect(out).toBe(file);
  });

  it('gagal decode (tanpa preserveAlpha) → file asli', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockRejectedValue(new Error('bad')),
    );
    const file = new File([new Uint8Array([1, 2, 3])], 'a.png', {
      type: 'image/png',
    });
    const out = await compressImageForUpload(file);
    expect(out).toBe(file);
    vi.unstubAllGlobals();
  });

  it('gagal decode + preserveAlpha → throw pesan jelas', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockRejectedValue(new Error('bad')),
    );
    const file = new File([new Uint8Array([1, 2, 3])], 'a.png', {
      type: 'image/png',
    });
    await expect(
      compressImageForUpload(file, { preserveAlpha: true }),
    ).rejects.toThrow(/tidak bisa dibaca/i);
    vi.unstubAllGlobals();
  });
});

describe('compressImageForUpload preserveAlpha', () => {
  it('PNG kecil dalam batas → file asli (tanpa re-encode)', async () => {
    const bitmap = {
      width: 64,
      height: 64,
      close: vi.fn(),
    };
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue(bitmap),
    );
    const file = new File([new Uint8Array(100)], 'logo.png', {
      type: 'image/png',
    });
    const out = await compressImageForUpload(file, {
      preserveAlpha: true,
      maxWidth: 512,
      maxHeight: 512,
    });
    expect(out).toBe(file);
    expect(out.type).toBe('image/png');
    vi.unstubAllGlobals();
  });

  it('preserveAlpha resize → output image/png', async () => {
    const bitmap = {
      width: 1000,
      height: 800,
      close: vi.fn(),
    };
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue(bitmap),
    );

    const toBlob = vi.fn(
      (cb: (b: Blob | null) => void, mime?: string) => {
        cb(new Blob([new Uint8Array([1, 2, 3])], { type: mime ?? 'image/png' }));
      },
    );
    const ctx = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob,
    };
    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        if (tag === 'canvas') return canvas;
        throw new Error(`unexpected element ${tag}`);
      },
    });

    const file = new File([new Uint8Array(500)], 'big-logo.png', {
      type: 'image/png',
    });
    const out = await compressImageForUpload(file, {
      preserveAlpha: true,
      maxWidth: 512,
      maxHeight: 512,
    });
    expect(out.type).toBe('image/png');
    expect(out.name.endsWith('.png')).toBe(true);
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(toBlob).toHaveBeenCalled();
    expect(toBlob.mock.calls[0]?.[1]).toBe('image/png');

    vi.unstubAllGlobals();
  });
});
