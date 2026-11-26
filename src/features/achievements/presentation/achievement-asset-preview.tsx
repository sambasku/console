import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Image } from 'antd';
import { Lottie } from 'lottie-react';
import { useMemo } from 'react';

export type BadgeAssetKind = 'image' | 'lottie';

function isDotLottieSource(url: string, fileName?: string | null): boolean {
  const n = fileName?.trim().toLowerCase() ?? '';
  if (n.endsWith('.lottie')) return true;
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.lottie');
  } catch {
    return url.toLowerCase().endsWith('.lottie');
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

  if (assetKind === 'image') {
    return (
      <Image src={url} width={size} height={size} style={{ objectFit: 'contain' }} alt="" />
    );
  }

  if (isDotLottieSource(url, fileName)) {
    return (
      <div style={{ width: size, height: size }} key={lottieKey}>
        <DotLottieReact src={url} loop autoplay style={{ width: size, height: size }} />
      </div>
    );
  }

  return (
    <Lottie
      key={lottieKey}
      src={url}
      loop
      autoplay
      style={{ width: size, height: size }}
    />
  );
}