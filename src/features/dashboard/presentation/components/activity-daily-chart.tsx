import { useMemo } from 'react';
import { Area } from '@ant-design/plots';
import { Typography } from 'antd';
import type { ActivityDailyPoint } from '../../domain/dashboard-stats';
import { buildTrendConfig, seriesColor, type ChartRow } from '@/shared/charts/chart-theme';

export interface ActivityDailyChartProps {
  points: ActivityDailyPoint[];
}

type SeriesKey = 'contributions' | 'votes' | 'comments' | 'newUsers' | 'searches';

const SERIES: Array<{ key: SeriesKey; label: string }> = [
  { key: 'contributions', label: 'Kontribusi' },
  { key: 'votes', label: 'Vote' },
  { key: 'comments', label: 'Komentar' },
  { key: 'newUsers', label: 'User baru' },
  { key: 'searches', label: 'Pencarian' },
];

function formatDayLabel(ymd: string): string {
  const [, month, day] = ymd.split('-');
  return `${Number(day)}/${Number(month)}`;
}

function formatFullDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Area chart multi-series gaya Cloudflare (smooth + gradient) - full width,
 * tooltip overlay stabil. Warna dari CHART_PALETTE, bukan token antd
 * (colorInfo = colorPrimary dulu bikin 2 series sama warna).
 */
export function ActivityDailyChart({ points }: ActivityDailyChartProps) {
  const colors = useMemo(() => SERIES.map((_, i) => seriesColor(i)), []);

  const totals = useMemo(
    () => ({
      contributions: points.reduce((s, p) => s + p.contributions, 0),
      votes: points.reduce((s, p) => s + p.votes, 0),
      comments: points.reduce((s, p) => s + p.comments, 0),
      newUsers: points.reduce((s, p) => s + p.newUsers, 0),
      searches: points.reduce((s, p) => s + p.searches, 0),
    }),
    [points],
  );

  const chartData = useMemo<ChartRow[]>(() => {
    const rows: ChartRow[] = [];
    for (const point of points) {
      for (const s of SERIES) {
        rows.push({
          date: point.date,
          dateLabel: formatDayLabel(point.date),
          series: s.label,
          value: point[s.key],
        });
      }
    }
    return rows;
  }, [points]);

  const config = useMemo(
    () =>
      buildTrendConfig({
        data: chartData,
        colors,
        height: 240,
        tooltip: {
          title: (d: ChartRow) => formatFullDate(d.date),
          items: [
            (d: ChartRow) => ({
              name: d.series,
              value: d.value.toLocaleString('id-ID'),
            }),
          ],
        },
      }),
    [chartData, colors],
  );

  return (
    <section
      className="dashboard__chart dashboard__chart--activity"
      aria-label="Aktivitas harian 30 hari terakhir"
    >
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            Aktivitas 30 hari
          </Typography.Title>
          <Typography.Text type="secondary" className="dashboard__chart-subtitle">
            Kontribusi · Vote · Komentar · User baru · Pencarian (WIB)
          </Typography.Text>
          <ul className="dashboard__chart-legend" aria-label="Legenda series">
            {SERIES.map((s, i) => (
              <li key={s.key} className="dashboard__chart-legend-item">
                <span
                  className="dashboard__chart-legend-swatch"
                  style={{ background: colors[i] }}
                  aria-hidden
                />
                <span>
                  {s.label}{' '}
                  <span className="dashboard__chart-legend-total">
                    ({totals[s.key].toLocaleString('id-ID')})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="dashboard__chart-canvas">
        <Area {...config} />
      </div>
    </section>
  );
}
