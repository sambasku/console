import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Image, Typography } from 'antd';
import { Lottie } from 'lottie-react';
import { useMemo, useState } from 'react';

export type BadgeAssetKind = 'image' | 'lottie';

export function isLottieBadgeUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.lottie') || pathname.endsWith('.json');
  } catch {
    const lower = url.toLowerCase();
    return lower.endsWith('.lottie') || lower.endsWith('.json');
  }
}

export function resolveBadgeAssetKind(
  url: string | null | undefined,
  wireKind: BadgeAssetKind | undefined,
): BadgeAssetKind {
  if (wireKind === 'lottie' || isLottieBadgeUrl(url)) return 'lottie';
  return wireKind ?? 'image';
}

function isDotLottieSource(url: string, fileName?: string | null): boolean {
  const n = fileName?.trim().toLowerCase() ?? '';
  if (n.endsWith('.lottie')) return true;
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.lottie');
  } catch {
    return url.toLowerCase().endsWith('.lottie');
  }
}

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

function fileNameFromUrl(url: string): string | undefined {
  try {
    const name = new URL(url).pathname.split('/').pop();
    return name || undefined;
  } catch {
    return undefined;
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
  const [failed, setFailed] = useState(false);
  const hintName = fileName ?? fileNameFromUrl(url) ?? null;
  const lottieKey = useMemo(
    () => `${url}|${hintName ?? ''}`,
    [url, hintName],
  );

  if (!url.trim()) return null;

  const isLottie = assetKind === 'lottie' || isLottieSource(url, hintName);

  if (!isLottie) {
    return (
      <Image src={url} width={size} height={size} style={{ objectFit: 'contain' }} alt="" />
    );
  }

  if (failed) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 11, maxWidth: size }}>
        Pratinjau gagal
      </Typography.Text>
    );
  }

  // Bodymovin .json: lottie-react (lottie-web). DotLottieReact cocok untuk .lottie (ZIP).
  if (isDotLottieSource(url, hintName)) {
    return (
      <div style={{ width: size, height: size }} key={lottieKey}>
        <DotLottieReact
          src={url}
          loop
          autoplay
          style={{ width: size, height: size }}
        />
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
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      subscriptions={{
        error: () => setFailed(true),
      }}
    />
  );
}