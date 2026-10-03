import { useState, type ReactNode } from 'react';
import { ApiOutlined, CalendarOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Modal, Skeleton, Typography } from 'antd';
import { formatRangeLabel } from '@/features/web-analytics/domain/date-range';
import type { DateRangeWire } from '../domain/play-analytics';
import type { PlayView } from '../application/play-provider-state';

export interface PlaySectionProps<T> {
  view: PlayView<T>;
  range: DateRangeWire | null | undefined;
  onRetry: () => void;
  children: (data: T) => ReactNode;
}

/** Wrapper state data Play: loading, belum terhubung, error, kosong, sukses. */
export function PlaySection<T>({ view, range, onRetry, children }: PlaySectionProps<T>) {
  const [setupOpen, setSetupOpen] = useState(false);
  const meta = (
    <Typography.Text type="secondary" className="traffic__source-meta">
      Data dari Google Play Console
      {range ? ` · ${formatRangeLabel(range)}` : ''}
    </Typography.Text>
  );

  switch (view.kind) {
    case 'loading':
      return (
        <div aria-busy="true" className="traffic__section">
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
    case 'not_configured':
      return (
        <div className="dashboard__chart traffic__state">
          <Empty
            image={<ApiOutlined className="traffic__state-icon" />}
            description={
              <>
                <Typography.Text strong>Play Console belum terhubung</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Hubungkan export statistik Play Console untuk melihat instal dan rating.
                </Typography.Text>
              </>
            }
          >
            <Button type="primary" onClick={() => setSetupOpen(true)}>
              Hubungkan
            </Button>
          </Empty>
          <SetupModal open={setupOpen} onClose={() => setSetupOpen(false)} />
        </div>
      );
    case 'error':
      return (
        <Alert
          type="warning"
          showIcon
          message="Play Console belum bisa dimuat"
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
          <Empty
            image={<CalendarOutlined className="traffic__state-icon" />}
            description={
              <>
                <Typography.Text strong>Laporan Play Console belum tersedia</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Laporan bulanan pertama dibuat Google sekitar 5 hari kerja setelah bulan tutup.
                  Cek lagi setelah awal bulan depan.
                </Typography.Text>
              </>
            }
          />
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

function SetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} cancelButtonProps={{ hidden: true }} okText="Mengerti" title="Play Console belum terhubung">
      <Typography.Paragraph type="secondary">
        Koneksi diatur di server lewat export CSV Google Cloud Storage. Kredensial tidak pernah dikirim ke console.
      </Typography.Paragraph>
      <ol className="traffic__setup-steps">
        <li>Di Play Console: Download reports &gt; Statistics, aktifkan export ke Cloud Storage.</li>
        <li>Salin nama bucket ke env API PLAY_STATS_GCS_BUCKET (mis. pubsrc_id.sambasku.app).</li>
        <li>Pakai service account yang sama dengan GA4 (GOOGLE_ANALYTICS_SA_EMAIL / PRIVATE_KEY), beri izin Object Viewer di bucket.</li>
        <li>Redeploy API, lalu muat ulang halaman ini.</li>
      </ol>
    </Modal>
  );
}
