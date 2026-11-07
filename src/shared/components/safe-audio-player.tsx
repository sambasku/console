import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { publicAudioUrlCandidates } from '@/shared/utils/public-audio-url';

const { Text, Link } = Typography;

export interface SafeAudioPlayerProps {
  url: string | null | undefined;
  /** Lebar maks player; default 420 */
  maxWidth?: number | string;
  style?: React.CSSProperties;
}

type FailKind = 'empty' | 'csp' | 'load';

/**
 * `<audio controls>` dengan fallback URL + pesan jelas saat gagal load.
 * Native control abu-abu/tidak bisa diklik biasanya karena src 404 atau CSP
 * media-src - tanpa onError user mengira tombolnya rusak.
 */
export function SafeAudioPlayer(props: SafeAudioPlayerProps) {
  return <SafeAudioPlayerSession key={props.url ?? ''} {...props} />;
}

function SafeAudioPlayerSession({ url, maxWidth = 420, style }: SafeAudioPlayerProps) {
  const candidates = useMemo(() => publicAudioUrlCandidates(url), [url]);
  const [index, setIndex] = useState(0);
  const [failKind, setFailKind] = useState<FailKind | null>(
    candidates.length === 0 ? 'empty' : null,
  );

  const src = candidates[index] ?? '';

  useEffect(() => {
    const onViolation = (ev: SecurityPolicyViolationEvent) => {
      if (ev.violatedDirective === 'media-src' || ev.effectiveDirective === 'media-src') {
        setFailKind('csp');
      }
    };
    document.addEventListener('securitypolicyviolation', onViolation);
    return () => document.removeEventListener('securitypolicyviolation', onViolation);
  }, []);

  if (!src || failKind) {
    const isCsp = failKind === 'csp';
    return (
      <Alert
        type="warning"
        showIcon
        message="Audio tidak dapat diputar"
        description={
          <Space direction="vertical" size={4}>
            <Text type="secondary">
              {isCsp
                ? 'Browser memblokir pemutaran di halaman (CSP media-src). Coba buka pranala di tab baru, atau pastikan header console mengizinkan media CDN/blob.'
                : failKind === 'empty'
                  ? 'URL audio kosong.'
                  : 'File tidak ditemukan di CDN (sering karena URL repo lama atau upload gagal).'}
            </Text>
            {url ? (
              <Link href={url} target="_blank" rel="noreferrer">
                Buka pranala tersimpan
              </Link>
            ) : null}
          </Space>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size={6} style={{ width: '100%', maxWidth, ...style }}>
      <audio
        key={src}
        controls
        preload="metadata"
        src={src}
        style={{ width: '100%' }}
        onError={() => {
          if (index + 1 < candidates.length) {
            setIndex((i) => i + 1);
            return;
          }
          setFailKind('load');
        }}
      />
      {index > 0 ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Memakai URL cadangan (CDN repo baru).
        </Text>
      ) : null}
      <Button type="link" size="small" href={src} target="_blank" rel="noreferrer" style={{ padding: 0 }}>
        Buka di tab baru
      </Button>
    </Space>
  );
}
