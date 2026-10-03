import { resolveProviderView } from '../../application/provider-state';
import { useWebAnalytics } from '../../application/use-web-analytics';
import type { BreakdownRow, RangeQuery } from '../../domain/web-analytics';
import { KpiGrid } from '../components/kpi-grid';
import { ProviderSection } from '../components/provider-section';
import { RequestErrorAlert } from '../components/request-error-alert';
import { ShareBars } from '../components/share-bars';
import { TableCard } from '../components/table-card';
import { TrendChart } from '../components/trend-chart';
import { DEVICE_LABELS, fmtInt, numericColumn } from '../format';

export function VisitorsTab({ query }: { query: RangeQuery }) {
  const q = useWebAnalytics('visitors', query);
  if (q.isError && !q.data) return <RequestErrorAlert error={q.error} onRetry={() => void q.refetch()} />;
  const view = resolveProviderView({ isPending: q.isPending, result: q.data?.ga4 });

  return (
    <ProviderSection source="ga4" view={view} range={q.data?.ga4?.range} onRetry={() => void q.refetch()}>
      {(d) => (
        <>
          <KpiGrid
            items={[
              { key: 'active', label: 'Pengguna aktif', value: d.totals.active_users, previous: d.previous.active_users, format: fmtInt },
              { key: 'total', label: 'Total pengguna', value: d.totals.total_users, previous: d.previous.total_users, format: fmtInt },
              { key: 'new', label: 'Pengguna baru', value: d.totals.new_users, previous: d.previous.new_users, format: fmtInt },
              { key: 'sessions', label: 'Sesi', value: d.totals.sessions, previous: d.previous.sessions, format: fmtInt },
              { key: 'views', label: 'Tampilan halaman', value: d.totals.page_views, previous: d.previous.page_views, format: fmtInt },
            ]}
          />
          <TrendChart
            title="Tren pengguna"
            points={d.trend}
            series={[
              { key: 'active_users', label: 'Pengguna aktif' },
              { key: 'sessions', label: 'Sesi' },
              { key: 'page_views', label: 'Tampilan halaman' },
            ]}
          />
          <div className="traffic__grid-2">
            <ShareBars
              title="Perangkat"
              unit="pengguna"
              rows={d.devices.map((r) => ({ key: r.key, label: DEVICE_LABELS[r.key] ?? r.key, value: r.users }))}
            />
            <TableCard<BreakdownRow>
              title="Negara"
              rows={d.countries}
              rowKey="key"
              columns={[
                { title: 'Negara', dataIndex: 'key', ellipsis: true },
                { title: 'Pengguna', dataIndex: 'users', render: fmtInt, ...numericColumn },
                { title: 'Sesi', dataIndex: 'sessions', render: fmtInt, ...numericColumn },
              ]}
            />
          </div>
        </>
      )}
    </ProviderSection>
  );
}
