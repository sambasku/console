import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Image } from 'antd';
import { Lottie } from 'lottie-react';

export type BadgeAssetKind = 'image' | 'lottie';

function isDotLottieUrl(url: string): boolean {
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
}: {
  url: string;
  assetKind: BadgeAssetKind;
  size?: number;
}) {
  if (!url.trim()) return null;

  if (assetKind === 'image') {
    return (
      <Image src={url} width={size} height={size} style={{ objectFit: 'contain' }} alt="" />
    );
  }

  if (isDotLottieUrl(url)) {
    return (
      <div style={{ width: size, height: size }}>
        <DotLottieReact src={url} loop autoplay style={{ width: size, height: size }} />
      </div>
    );
  }

  return (
    <Lottie
      src={url}
      loop
      autoplay
      style={{ width: size, height: size }}
    />
  );
}