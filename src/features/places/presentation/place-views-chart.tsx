import { useMemo } from 'react';
import { Line } from '@ant-design/plots';
import { theme, Typography } from 'antd';

export interface PlaceViewsChartProps {
  /** Titik per hari: label tanggal WIB + total view. */
  points: Array<{ day: string; total: number }>;
  days: number;
}

type ChartRow = { date: string; dateLabel: string; series: string; value: number };

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
 * Line chart view harian - pola sama dengan chart Aktivitas di Ringkasan
 * (legend + total per series, tooltip tanggal lengkap).
 */
export function PlaceViewsChart({ points, days }: PlaceViewsChartProps) {
  const { token } = theme.useToken();

  const total = useMemo(() => points.reduce((s, p) => s + p.total, 0), [points]);

  const chartData = useMemo<ChartRow[]>(
    () =>
      points.map((p) => ({
        date: p.day,
        dateLabel: formatDayLabel(p.day),
        series: 'View',
        value: p.total,
      })),
    [points],
  );

  const config = useMemo(
    () => ({
      data: chartData,
      xField: 'dateLabel',
      yField: 'value',
      colorField: 'series',
      autoFit: true,
      height: 240,
      scale: {
        color: { range: [token.colorPrimary] },
        y: { nice: true, domainMin: 0 },
      },
      axis: {
        x: { title: false, labelAutoHide: true, labelAutoRotate: false },
        y: { title: false },
      },
      legend: false,
      style: { lineWidth: 2 },
      interaction: { tooltip: { shared: true } },
      tooltip: {
        title: (d: ChartRow) => formatFullDate(d.date),
        items: [(d: ChartRow) => ({ name: d.series, value: d.value.toLocaleString('id-ID') })],
      },
    }),
    [chartData, token.colorPrimary],
  );

  return (
    <section className="dashboard__chart dashboard__chart--activity" aria-label="View harian">
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            View {days} hari
          </Typography.Title>
          <Typography.Text type="secondary" className="dashboard__chart-subtitle">
            Pembukaan detail tempat dari web dan mobile (WIB)
          </Typography.Text>
          <ul className="dashboard__chart-legend" aria-label="Legenda series">
            <li className="dashboard__chart-legend-item">
              <span
                className="dashboard__chart-legend-swatch"
                style={{ background: token.colorPrimary }}
                aria-hidden
              />
              <span>
                View{' '}
                <span className="dashboard__chart-legend-total">
                  ({total.toLocaleString('id-ID')})
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="dashboard__chart-canvas">
        <Line {...config} />
      </div>
    </section>
  );
}
