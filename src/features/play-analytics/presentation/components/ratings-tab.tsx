import { Typography } from 'antd';
import { usePlayAnalytics } from '../../application/use-play-analytics';
import { resolvePlayView } from '../../application/play-provider-state';
import type { RangeQuery } from '../../domain/play-analytics';
import { KpiGrid } from './kpi-grid';
import { PlaySection } from './play-section';
import { PlayRequestErrorAlert } from './play-request-error-alert';
import { fmtInt, fmtRating } from './format';

const STAR_COLORS: Record<number, string> = {
  5: '#52c41a',
  4: '#95de64',
  3: '#faad14',
  2: '#ff7a45',
  1: '#ff4d4f',
};

export function RatingsTab({ query }: { query: RangeQuery }) {
  const q = usePlayAnalytics('ratings', query);
  const retry = () => void q.refetch();
  if (q.isError && !q.data) return <PlayRequestErrorAlert error={q.error} onRetry={retry} />;
  const view = resolvePlayView({ isPending: q.isPending, result: q.data?.play });

  return (
    <PlaySection view={view} range={q.data?.play.range} onRetry={retry}>
      {(d) => (
        <>
          <KpiGrid
            items={[
              { key: 'avg', label: 'Rating rata-rata', value: d.totals.average_rating, previous: d.previous.average_rating, format: fmtRating },
              { key: 'count', label: 'Jumlah ulasan', value: d.totals.rating_count, previous: d.previous.rating_count, format: fmtInt },
              { key: 'installs', label: 'Instal baru', value: d.totals.new_installs, previous: d.previous.new_installs, format: fmtInt },
            ]}
          />
          <section className="dashboard__chart" aria-label="Distribusi bintang">
            <div className="dashboard__chart-header">
              <Typography.Title level={5} className="dashboard__chart-title">
                Distribusi bintang
              </Typography.Title>
            </div>
            {d.buckets.length === 0 ? (
              <Typography.Text type="secondary">
                Export CSV Play tidak menyertakan distribusi bintang. Datanya butuh Play Developer Reporting API.
              </Typography.Text>
            ) : (
              <ul className="dashboard__bars-list traffic__share-list">
                {d.buckets.map((b) => (
                  <li key={b.stars} className="dashboard__bars-row traffic__share-row">
                    <span className="dashboard__bars-label">{b.stars} bintang</span>
                    <span className="dashboard__bars-track">
                      <span
                        className="dashboard__bars-fill"
                        style={{ width: `${b.share * 100}%`, background: STAR_COLORS[b.stars] }}
                      />
                    </span>
                    <span className="dashboard__bars-value">{fmtInt(b.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PlaySection>
  );
}
