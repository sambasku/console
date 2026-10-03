import { usePlayAnalytics } from '../../application/use-play-analytics';
import { resolvePlayView } from '../../application/play-provider-state';
import type { PlayGrowth, RangeQuery } from '../../domain/play-analytics';
import { KpiGrid } from './kpi-grid';
import { PlaySection } from './play-section';
import { PlayRequestErrorAlert } from './play-request-error-alert';
import { TrendChart } from './trend-chart';
import { fmtInt } from './format';

export function GrowthTab({ query }: { query: RangeQuery }) {
  const q = usePlayAnalytics('growth', query);
  const retry = () => void q.refetch();
  if (q.isError && !q.data) return <PlayRequestErrorAlert error={q.error} onRetry={retry} />;
  const view = resolvePlayView<PlayGrowth>({ isPending: q.isPending, result: q.data?.play });

  return (
    <PlaySection view={view} range={q.data?.play.range} onRetry={retry}>
      {(d) => (
        <>
          <KpiGrid
            items={[
              { key: 'installs', label: 'Instal baru', value: d.totals.new_installs, previous: d.previous.new_installs, format: fmtInt },
              { key: 'uninstalls', label: 'Uninstall', value: d.totals.uninstalls, previous: d.previous.uninstalls, format: fmtInt },
              { key: 'net', label: 'Pertumbuhan bersih', value: d.totals.new_installs - d.totals.uninstalls, previous: d.previous.new_installs - d.previous.uninstalls, format: fmtInt },
              { key: 'active', label: 'Instal aktif', value: d.totals.active_installs, previous: d.previous.active_installs, format: fmtInt },
            ]}
          />
          <TrendChart
            title="Pertumbuhan bersih harian"
            subtitle="Instal dikurangi uninstall per hari"
            points={d.net_trend}
            series={[{ key: 'net', label: 'Bersih' }]}
          />
        </>
      )}
    </PlaySection>
  );
}
