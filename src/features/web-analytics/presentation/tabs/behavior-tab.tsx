import { resolveProviderView } from '../../application/provider-state';
import { useWebAnalytics } from '../../application/use-web-analytics';
import type { EventRow, LandingPageRow, PageRow, RangeQuery } from '../../domain/web-analytics';
import { KpiGrid } from '../components/kpi-grid';
import { ProviderSection } from '../components/provider-section';
import { RequestErrorAlert } from '../components/request-error-alert';
import { TableCard } from '../components/table-card';
import { fmtInt, fmtRatio, numericColumn } from '../format';

export function BehaviorTab({ query }: { query: RangeQuery }) {
  const q = useWebAnalytics('behavior', query);
  if (q.isError && !q.data) return <RequestErrorAlert error={q.error} onRetry={() => void q.refetch()} />;
  const view = resolveProviderView({ isPending: q.isPending, result: q.data?.ga4 });

  return (
    <ProviderSection source="ga4" view={view} range={q.data?.ga4?.range} onRetry={() => void q.refetch()}>
      {(d) => (
        <>
          <KpiGrid
            items={[
              { key: 'views', label: 'Tampilan halaman', value: d.totals.page_views, previous: d.previous.page_views, format: fmtInt },
              { key: 'events', label: 'Event', value: d.totals.event_count, previous: d.previous.event_count, format: fmtInt },
              {
                key: 'engagement',
                label: 'Engagement rate',
                value: d.totals.engagement_rate,
                previous: d.previous.engagement_rate,
                format: (n) => fmtRatio(n),
              },
            ]}
          />
          <TableCard<PageRow>
            title="Halaman paling banyak dibuka"
            rows={d.top_pages}
            rowKey="path"
            columns={[
              { title: 'Halaman', dataIndex: 'path', ellipsis: true },
              { title: 'Views', dataIndex: 'views', render: fmtInt, ...numericColumn },
              { title: 'Pengguna', dataIndex: 'users', render: fmtInt, ...numericColumn },
            ]}
          />
          <div className="traffic__grid-2">
            <TableCard<LandingPageRow>
              title="Halaman pendaratan"
              subtitle="Halaman pertama yang dibuka saat sesi dimulai"
              rows={d.landing_pages}
              rowKey="path"
              columns={[
                { title: 'Halaman', dataIndex: 'path', ellipsis: true },
                { title: 'Sesi', dataIndex: 'sessions', render: fmtInt, ...numericColumn },
                { title: 'Engagement', dataIndex: 'engagement_rate', render: (n: number) => fmtRatio(n), ...numericColumn },
              ]}
            />
            <TableCard<EventRow>
              title="Event"
              rows={d.events}
              rowKey="name"
              columns={[
                { title: 'Event', dataIndex: 'name', ellipsis: true },
                { title: 'Jumlah', dataIndex: 'count', render: fmtInt, ...numericColumn },
                { title: 'Pengguna', dataIndex: 'users', render: fmtInt, ...numericColumn },
              ]}
            />
          </div>
        </>
      )}
    </ProviderSection>
  );
}
