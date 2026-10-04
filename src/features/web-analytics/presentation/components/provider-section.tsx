import { useState, type ReactNode } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Modal, Skeleton, Typography } from 'antd';
import type { ProviderView } from '../../application/provider-state';
import { formatRangeLabel } from '../../domain/date-range';
import type { DateRangeWire } from '../../domain/web-analytics';

type Source = 'ga4' | 'search_console';

const SOURCE_COPY: Record<Source, { name: string; title: string; description: string }> = {
  ga4: {
    name: 'Google Analytics 4',
    title: 'Google Analytics belum terhubung',
    description: 'Hubungkan Google Analytics untuk melihat data pengunjung dan perilaku pengguna.',
  },
  search_console: {
    name: 'Google Search Console',
    title: 'Google Search Console belum terhubung',
    description: 'Hubungkan Search Console untuk melihat performa pencarian SambasKu.',
  },
};

export interface ProviderSectionProps<T> {
  source: Source;
  view: ProviderView<T>;
  range: DateRangeWire | null | undefined;
  onRetry: () => void;
  /** Skeleton mengikuti layout tab; default KPI + chart. */
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Wrapper state per provider: loading, belum terhubung, error, kosong, sukses.
 * Sumber data tampil sebagai metadata kecil, bukan judul/menu.
 */
export function ProviderSection<T>({ source, view, range, onRetry, skeleton, children }: ProviderSectionProps<T>) {
  const copy = SOURCE_COPY[source];
  const [setupOpen, setSetupOpen] = useState(false);
  const meta = (
    <Typography.Text type="secondary" className="traffic__source-meta">
      Data dari {copy.name}
      {range ? ` · ${formatRangeLabel(range)}` : ''}
    </Typography.Text>
  );

  switch (view.kind) {
    case 'loading':
      return <div aria-busy="true">{skeleton ?? <DefaultSkeleton />}</div>;
    case 'not_configured':
      return (
        <div className="dashboard__chart traffic__state">
          <Empty
            image={<ApiOutlined className="traffic__state-icon" />}
            description={
              <>
                <Typography.Text strong>{copy.title}</Typography.Text>
                <br />
                <Typography.Text type="secondary">{copy.description}</Typography.Text>
              </>
            }
          >
            <Button type="primary" onClick={() => setSetupOpen(true)}>
              Hubungkan
            </Button>
          </Empty>
          <SetupModal source={source} open={setupOpen} onClose={() => setSetupOpen(false)} />
        </div>
      );
    case 'error':
      return (
        <Alert
          type="warning"
          showIcon
          message={`${copy.name} belum bisa dimuat`}
          description={
            <>
              {view.message}
              <br />
              <Typography.Text type="secondary" className="traffic__source-meta">
                Kode: {view.code}
              </Typography.Text>
            </>
          }
          action={
            <Button size="small" onClick={onRetry}>
              Coba lagi
            </Button>
          }
        />
      );
    case 'empty':
      return (
        <div className="dashboard__chart traffic__state">
          <Empty description="Belum ada data di rentang tanggal ini." />
          {meta}
        </div>
      );
    case 'ok':
      return (
        <div className="traffic__section">
          {children(view.data)}
          {meta}
        </div>
      );
  }
}

function DefaultSkeleton() {
  return (
    <div className="traffic__section">
      <div className="dashboard__kpi traffic__kpi">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton.Input key={i} active block style={{ height: 88 }} />
        ))}
      </div>
      <div className="dashboard__chart dashboard__chart--skeleton">
        <Skeleton active paragraph={{ rows: 6 }} title={{ width: 180 }} />
      </div>
    </div>
  );
}

function SetupModal({ source, open, onClose }: { source: Source; open: boolean; onClose: () => void }) {
  const steps =
    source === 'ga4'
      ? [
          'Aktifkan Google Analytics Data API di project Google Cloud.',
          'Buat service account + key JSON, isi env API GOOGLE_ANALYTICS_SA_EMAIL dan GOOGLE_ANALYTICS_SA_PRIVATE_KEY.',
          'Isi GA4_PROPERTY_ID dengan ID angka property GA4 (bukan G-XXXX).',
          'Di GA4: Admin > Property access management, tambahkan email service account sebagai Viewer.',
          'Redeploy API, lalu muat ulang halaman ini.',
        ]
      : [
          'Aktifkan Google Search Console API di project Google Cloud yang sama.',
          'Pakai service account yang sama (GOOGLE_ANALYTICS_SA_EMAIL / GOOGLE_ANALYTICS_SA_PRIVATE_KEY).',
          'Isi SEARCH_CONSOLE_SITE_URL, misalnya sc-domain:sambasku.com.',
          'Di Search Console: Settings > Users and permissions, tambahkan email service account.',
          'Redeploy API, lalu muat ulang halaman ini.',
        ];
  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} cancelButtonProps={{ hidden: true }} okText="Mengerti" title={SOURCE_COPY[source].title}>
      <Typography.Paragraph type="secondary">
        Koneksi diatur di server lewat service account. Kredensial tidak pernah dikirim ke console.
      </Typography.Paragraph>
      <ol className="traffic__setup-steps">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <Typography.Text type="secondary">Panduan lengkap: docs/backlogs/ANALITIK_GOOGLE.md</Typography.Text>
    </Modal>
  );
}
