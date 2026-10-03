import { Result } from 'antd';

/**
 * Blocker halaman analitik di build staging. Panggilan ke API eksternal
 * (GA4, Search Console, GCS) dihemat: hanya production yang boleh memicu.
 * Lokal (mode development) tetap terbuka untuk kerjaan.
 */
export function StagingBlocked({ title }: { title: string }) {
  if (import.meta.env.MODE !== 'staging') return null;
  return (
    <Result
      status="403"
      title={title}
      subTitle="Halaman analitik hanya tersedia di mode Production. Panggilan ke API eksternal Google dihemat di staging."
    />
  );
}
