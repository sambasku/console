import { useMemo } from 'react';
import { Line } from '@ant-design/plots';
import { theme, Typography } from 'antd';
import type { ActivityDailyPoint } from '../../domain/dashboard-stats';

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

type ChartRow = {
  date: string;
  dateLabel: string;
  series: string;
  value: number;
};

/**
 * Line chart multi-series via @ant-design/plots - full width, tooltip overlay stabil.
 */
export function ActivityDailyChart({ points }: ActivityDailyChartProps) {
  const { token } = theme.useToken();

  const colors = useMemo(
    () => [
      token.colorPrimary,
      token.colorSuccess,
      token.colorWarning,
      token.colorInfo,
      token.colorError,
    ],
    [
      token.colorPrimary,
      token.colorSuccess,
      token.colorWarning,
      token.colorInfo,
      token.colorError,
    ],
  );

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

  const chartData = useMemo(() => {
    const rows: ChartRow[] = [];
    for (const point of points) {
      const dateLabel = formatDayLabel(point.date);
      for (const s of SERIES) {
        rows.push({
          date: point.date,
          dateLabel,
          series: s.label,
          value: point[s.key],
        });
      }
    }
    return rows;
  }, [points]);

  const config = useMemo(
    () => ({
      data: chartData,
      xField: 'dateLabel',
      yField: 'value',
      colorField: 'series',
      autoFit: true,
      height: 240,
      scale: {
        color: { range: colors },
        y: { nice: true, domainMin: 0 },
      },
      axis: {
        x: {
          title: false,
          labelAutoHide: true,
          labelAutoRotate: false,
        },
        y: {
          title: false,
        },
      },
      legend: false,
      style: {
        lineWidth: 2,
      },
      interaction: {
        tooltip: {
          shared: true,
        },
      },
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
    <section className="dashboard__chart dashboard__chart--activity" aria-label="Aktivitas harian 30 hari terakhir">
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
        <Line {...config} />
      </div>
    </section>
  );
}
