import { usePlayAnalytics } from '../../application/use-play-analytics';
import { resolvePlayView } from '../../application/play-provider-state';
import type { RangeQuery } from '../../domain/play-analytics';
import { KpiGrid } from './kpi-grid';
import { PlaySection } from './play-section';
import { PlayRequestErrorAlert } from './play-request-error-alert';
import { TrendChart } from './trend-chart';
import { fmtInt } from './format';

export function OverviewTab({ query }: { query: RangeQuery }) {
  const q = usePlayAnalytics('overview', query);
  const retry = () => void q.refetch();
  if (q.isError && !q.data) return <PlayRequestErrorAlert error={q.error} onRetry={retry} />;
  const view = resolvePlayView({ isPending: q.isPending, result: q.data?.play });

  return (
    <PlaySection view={view} range={q.data?.play.range} onRetry={retry}>
      {(d) => (
        <>
          <KpiGrid
            items={[
              { key: 'installs', label: 'Instal baru', value: d.totals.new_installs, previous: d.previous.new_installs, format: fmtInt },
              { key: 'active', label: 'Instal aktif', value: d.totals.active_installs, previous: d.previous.active_installs, format: fmtInt },
              { key: 'uninstalls', label: 'Uninstall', value: d.totals.uninstalls, previous: d.previous.uninstalls, format: fmtInt },
              { key: 'rating', label: 'Rating rata-rata', value: d.totals.average_rating, previous: d.previous.average_rating, format: (n) => n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
            ]}
          />
          <TrendChart
            title="Instal & uninstall harian"
            points={d.trend}
            series={[
              { key: 'installs', label: 'Instal' },
              { key: 'uninstalls', label: 'Uninstall' },
            ]}
          />
        </>
      )}
    </PlaySection>
  );
}
