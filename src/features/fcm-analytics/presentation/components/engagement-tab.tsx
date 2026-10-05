import { Typography } from 'antd';
import { useFcmAnalytics } from '../../application/use-fcm-analytics';
import { resolveFcmView } from '../../application/fcm-provider-state';
import type { RangeQuery } from '../../domain/fcm-analytics';
import { FcmKpiGrid } from './fcm-kpi-grid';
import { FcmSection } from './fcm-section';
import { FcmRequestErrorAlert } from './fcm-request-error-alert';
import { FcmTrendChart } from './fcm-trend-chart';
import { fmtInt, fmtRatio } from './format';

export function EngagementTab({ query }: { query: RangeQuery }) {
  const q = useFcmAnalytics('engagement', query);
  const retry = () => void q.refetch();
  if (q.isError && !q.data) return <FcmRequestErrorAlert error={q.error} onRetry={retry} />;
  const view = resolveFcmView({ isPending: q.isPending, result: q.data?.fcm });

  return (
    <FcmSection view={view} range={q.data?.fcm.range} onRetry={retry}>
      {(d) => (
        <>
          <FcmKpiGrid
            items={[
              { key: 'opened', label: 'Dibuka', value: d.totals.opened, previous: d.previous.opened, format: fmtInt },
              { key: 'open_rate', label: 'Open rate', value: d.totals.open_rate, previous: d.previous.open_rate, format: (n) => fmtRatio(n) },
              {
                key: 'engagement',
                label: 'Durasi di app rata-rata',
                value: d.avg_engagement_seconds,
                previous: d.avg_engagement_seconds,
                format: (n) => `${fmtInt(n)} detik`,
              },
            ]}
          />
          <FcmTrendChart
            title="Notifikasi dibuka per hari"
            points={d.trend}
            series={[{ key: 'opened', label: 'Dibuka' }]}
            height={220}
          />
          <Typography.Text type="secondary" className="traffic__source-meta">
            Open rate = notifikasi dibuka dibagi jumlah diterima perangkat. Durasi di app dari engagement duration setelah event notification_open.
          </Typography.Text>
        </>
      )}
    </FcmSection>
  );
}
