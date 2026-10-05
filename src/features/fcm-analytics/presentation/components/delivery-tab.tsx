import { Typography } from 'antd';
import { useFcmAnalytics } from '../../application/use-fcm-analytics';
import { resolveFcmView } from '../../application/fcm-provider-state';
import type { RangeQuery } from '../../domain/fcm-analytics';
import { FcmKpiGrid } from './fcm-kpi-grid';
import { FcmSection } from './fcm-section';
import { FcmRequestErrorAlert } from './fcm-request-error-alert';
import { FcmTrendChart } from './fcm-trend-chart';
import { fmtInt, fmtRatio } from './format';

export function DeliveryTab({ query }: { query: RangeQuery }) {
  const q = useFcmAnalytics('delivery', query);
  const retry = () => void q.refetch();
  if (q.isError && !q.data) return <FcmRequestErrorAlert error={q.error} onRetry={retry} />;
  const view = resolveFcmView({ isPending: q.isPending, result: q.data?.fcm });

  return (
    <FcmSection view={view} range={q.data?.fcm.range} onRetry={retry}>
      {(d) => (
        <>
          <FcmKpiGrid
            items={[
              { key: 'sent', label: 'Terkirim', value: d.totals.sent, previous: d.previous.sent, format: fmtInt },
              { key: 'delivered', label: 'Diterima perangkat', value: d.totals.delivered, previous: d.previous.delivered, format: fmtInt },
              { key: 'failed', label: 'Gagal', value: d.totals.failed, previous: d.previous.failed, format: fmtInt },
              { key: 'opened', label: 'Dibuka', value: d.totals.opened, previous: d.previous.opened, format: fmtInt },
            ]}
          />
          <FcmTrendChart
            title="Pengiriman & penerimaan harian"
            subtitle={d.latest_data_date ? `Data delivery terbaru per ${d.latest_data_date}` : undefined}
            points={d.trend}
            series={[
              { key: 'sent', label: 'Terkirim' },
              { key: 'delivered', label: 'Diterima' },
            ]}
          />
          <FcmTrendChart
            title="Notifikasi dibuka per hari"
            points={d.trend}
            series={[{ key: 'opened', label: 'Dibuka' }]}
            height={180}
          />
          <Typography.Text type="secondary" className="traffic__source-meta">
            Open rate periode ini {fmtRatio(d.totals.open_rate)} - dibagi jumlah diterima perangkat.
          </Typography.Text>
        </>
      )}
    </FcmSection>
  );
}
