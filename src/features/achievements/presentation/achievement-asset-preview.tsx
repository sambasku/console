import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Image } from 'antd';
import { useMemo } from 'react';

export type BadgeAssetKind = 'image' | 'lottie';

function isLottieSource(url: string, fileName?: string | null): boolean {
  const n = fileName?.trim().toLowerCase() ?? '';
  if (n.endsWith('.lottie') || n.endsWith('.json')) return true;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.lottie') || pathname.endsWith('.json');
  } catch {
    const lower = url.toLowerCase();
    return lower.endsWith('.lottie') || lower.endsWith('.json');
  }
}

export function AchievementAssetPreview({
  url,
  assetKind,
  size = 120,
  fileName,
}: {
  url: string;
  assetKind: BadgeAssetKind;
  size?: number;
  /** Nama file asli (penting untuk blob: pratinjau lokal). */
  fileName?: string | null;
}) {
  const lottieKey = useMemo(() => `${url}|${fileName ?? ''}`, [url, fileName]);

  if (!url.trim()) return null;

  const isLottie = assetKind === 'lottie' || isLottieSource(url, fileName);

  if (!isLottie) {
    return (
      <Image src={url} width={size} height={size} style={{ objectFit: 'contain' }} alt="" />
    );
  }

  // DotLottieReact (dotlottie-web WASM) menangani .lottie (ZIP) dan .json
  // sekaligus lewat fetch() tanpa perlu lottie-web / 'unsafe-eval'.
  return (
    <div style={{ width: size, height: size }} key={lottieKey}>
      <DotLottieReact src={url} loop autoplay style={{ width: size, height: size }} />
    </div>
  );
}