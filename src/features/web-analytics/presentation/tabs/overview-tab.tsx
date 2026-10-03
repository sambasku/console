import { resolveProviderView } from '../../application/provider-state';
import { useWebAnalytics } from '../../application/use-web-analytics';
import type { PageRow, QueryRow, RangeQuery } from '../../domain/web-analytics';
import { KpiGrid } from '../components/kpi-grid';
import { ProviderSection } from '../components/provider-section';
import { RequestErrorAlert } from '../components/request-error-alert';
import { TableCard } from '../components/table-card';
import { TrendChart } from '../components/trend-chart';
import { fmtInt, fmtPosition, fmtRatio, numericColumn } from '../format';

export function OverviewTab({ query }: { query: RangeQuery }) {
  const q = useWebAnalytics('overview', query);
  const retry = () => void q.refetch();
  if (q.isError && !q.data) return <RequestErrorAlert error={q.error} onRetry={retry} />;
  const ga4 = resolveProviderView({ isPending: q.isPending, result: q.data?.ga4 });
  const gsc = resolveProviderView({ isPending: q.isPending, result: q.data?.search_console });

  return (
    <div className="traffic__stack">
      <ProviderSection source="ga4" view={ga4} range={q.data?.ga4?.range} onRetry={retry}>
        {(d) => (
          <>
            <KpiGrid
              items={[
                { key: 'active', label: 'Pengguna aktif', value: d.totals.active_users, previous: d.previous.active_users, format: fmtInt },
                { key: 'sessions', label: 'Sesi', value: d.totals.sessions, previous: d.previous.sessions, format: fmtInt },
                { key: 'views', label: 'Tampilan halaman', value: d.totals.page_views, previous: d.previous.page_views, format: fmtInt },
                { key: 'events', label: 'Event', value: d.totals.event_count, previous: d.previous.event_count, format: fmtInt },
              ]}
            />
            <TrendChart
              title="Tren pengunjung"
              points={d.trend}
              series={[
                { key: 'active_users', label: 'Pengguna aktif' },
                { key: 'sessions', label: 'Sesi' },
              ]}
            />
            <TableCard<PageRow>
              title="Halaman teratas"
              rows={d.top_pages.slice(0, 5)}
              rowKey="path"
              columns={[
                { title: 'Halaman', dataIndex: 'path', ellipsis: true },
                { title: 'Views', dataIndex: 'views', render: fmtInt, ...numericColumn },
                { title: 'Pengguna', dataIndex: 'users', render: fmtInt, ...numericColumn },
              ]}
            />
          </>
        )}
      </ProviderSection>

      <ProviderSection source="search_console" view={gsc} range={q.data?.search_console?.range} onRetry={retry}>
        {(d) => (
          <>
            <KpiGrid
              items={[
                { key: 'clicks', label: 'Klik dari Google', value: d.totals.clicks, previous: d.previous.clicks, format: fmtInt },
                { key: 'impressions', label: 'Impresi', value: d.totals.impressions, previous: d.previous.impressions, format: fmtInt },
                { key: 'ctr', label: 'CTR', value: d.totals.ctr, previous: d.previous.ctr, format: (n) => fmtRatio(n, 2) },
                { key: 'position', label: 'Posisi rata-rata', value: d.totals.position, previous: d.previous.position, format: fmtPosition, lowerIsBetter: true },
              ]}
            />
            <TableCard<QueryRow>
              title="Kata kunci teratas"
              rows={d.top_queries.slice(0, 5)}
              rowKey="query"
              columns={[
                { title: 'Kata kunci', dataIndex: 'query', ellipsis: true },
                { title: 'Klik', dataIndex: 'clicks', render: fmtInt, ...numericColumn },
                { title: 'Impresi', dataIndex: 'impressions', render: fmtInt, ...numericColumn },
              ]}
            />
          </>
        )}
      </ProviderSection>
    </div>
  );
}
