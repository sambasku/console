import { resolveProviderView } from '../../application/provider-state';
import { useWebAnalytics } from '../../application/use-web-analytics';
import type { QueryRow, RangeQuery, SearchPageRow } from '../../domain/web-analytics';
import { KpiGrid } from '../components/kpi-grid';
import { ProviderSection } from '../components/provider-section';
import { RequestErrorAlert } from '../components/request-error-alert';
import { TableCard } from '../components/table-card';
import { TrendChart } from '../components/trend-chart';
import { fmtInt, fmtPosition, fmtRatio, numericColumn } from '../format';

const searchColumns = [
  { title: 'Klik', dataIndex: 'clicks', render: fmtInt, ...numericColumn },
  { title: 'Impresi', dataIndex: 'impressions', render: fmtInt, ...numericColumn },
  { title: 'CTR', dataIndex: 'ctr', render: (n: number) => fmtRatio(n, 2), ...numericColumn },
  { title: 'Posisi', dataIndex: 'position', render: fmtPosition, ...numericColumn },
];

export function SearchTab({ query }: { query: RangeQuery }) {
  const q = useWebAnalytics('search', query);
  if (q.isError && !q.data) return <RequestErrorAlert error={q.error} onRetry={() => void q.refetch()} />;
  const view = resolveProviderView({ isPending: q.isPending, result: q.data?.search_console });

  return (
    <ProviderSection
      source="search_console"
      view={view}
      range={q.data?.search_console?.range}
      onRetry={() => void q.refetch()}
    >
      {(d) => (
        <>
          <KpiGrid
            items={[
              { key: 'clicks', label: 'Klik', value: d.totals.clicks, previous: d.previous.clicks, format: fmtInt },
              { key: 'impressions', label: 'Impresi', value: d.totals.impressions, previous: d.previous.impressions, format: fmtInt },
              { key: 'ctr', label: 'CTR', value: d.totals.ctr, previous: d.previous.ctr, format: (n) => fmtRatio(n, 2) },
              { key: 'position', label: 'Posisi rata-rata', value: d.totals.position, previous: d.previous.position, format: fmtPosition, lowerIsBetter: true },
            ]}
          />
          {/* Skala klik dan impresi beda jauh - dua chart supaya garis klik tidak gepeng. */}
          <div className="traffic__grid-2">
            <TrendChart title="Klik per hari" points={d.trend} series={[{ key: 'clicks', label: 'Klik' }]} height={200} />
            <TrendChart
              title="Impresi per hari"
              points={d.trend}
              series={[{ key: 'impressions', label: 'Impresi' }]}
              height={200}
            />
          </div>
          <TableCard<QueryRow>
            title="Kata kunci teratas"
            rows={d.top_queries}
            rowKey="query"
            columns={[{ title: 'Kata kunci', dataIndex: 'query', ellipsis: true }, ...searchColumns]}
          />
          <TableCard<SearchPageRow>
            title="Halaman teratas dari pencarian"
            subtitle="Halaman yang paling banyak dapat trafik organik dari Google"
            rows={d.top_pages}
            rowKey="page"
            columns={[{ title: 'Halaman', dataIndex: 'page', ellipsis: true }, ...searchColumns]}
          />
        </>
      )}
    </ProviderSection>
  );
}
