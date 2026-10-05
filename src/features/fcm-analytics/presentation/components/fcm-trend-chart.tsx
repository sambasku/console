import { Line } from '@ant-design/plots';
import { theme, Typography } from 'antd';
import { useMemo } from 'react';
import { formatYmd } from '@/features/web-analytics/domain/date-range';

export interface FcmTrendSeries<K extends string> {
  key: K;
  label: string;
}

export interface FcmTrendChartProps<K extends string> {
  title: string;
  subtitle?: string;
  points: Array<{ date: string } & Record<K, number>>;
  series: Array<FcmTrendSeries<K>>;
  height?: number;
}

type ChartRow = { date: string; dateLabel: string; series: string; value: number };

function dayLabel(ymd: string): string {
  const [, month, day] = ymd.split('-');
  return `${Number(day)}/${Number(month)}`;
}

/** Line chart tren harian notifikasi, pola sama dengan TrendChart Play Store. */
export function FcmTrendChart<K extends string>({ title, subtitle, points, series, height = 240 }: FcmTrendChartProps<K>) {
  const { token } = theme.useToken();
  const colors = useMemo(
    () => [token.colorPrimary, token.colorSuccess, token.colorWarning],
    [token.colorPrimary, token.colorSuccess, token.colorWarning],
  );

  const data = useMemo(() => {
    const rows: ChartRow[] = [];
    for (const p of points) {
      for (const s of series) {
        rows.push({ date: p.date, dateLabel: dayLabel(p.date), series: s.label, value: p[s.key] });
      }
    }
    return rows;
  }, [points, series]);

  const config = useMemo(
    () => ({
      data,
      xField: 'dateLabel',
      yField: 'value',
      colorField: 'series',
      autoFit: true,
      height,
      scale: { color: { range: colors }, y: { nice: true, domainMin: 0 } },
      axis: {
        x: { title: false, labelAutoHide: true, labelAutoRotate: false },
        y: { title: false },
      },
      legend: false,
      style: { lineWidth: 2 },
      interaction: { tooltip: { shared: true } },
      tooltip: {
        title: (d: ChartRow) => formatYmd(d.date),
        items: [(d: ChartRow) => ({ name: d.series, value: d.value.toLocaleString('id-ID') })],
      },
    }),
    [data, colors, height],
  );

  return (
    <section className="dashboard__chart" aria-label={title}>
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            {title}
          </Typography.Title>
          {subtitle ? (
            <Typography.Text type="secondary" className="dashboard__chart-subtitle">
              {subtitle}
            </Typography.Text>
          ) : null}
          {series.length > 1 ? (
            <ul className="dashboard__chart-legend" aria-label="Legenda series">
              {series.map((s, i) => (
                <li key={s.key} className="dashboard__chart-legend-item">
                  <span className="dashboard__chart-legend-swatch" style={{ background: colors[i] }} aria-hidden />
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="dashboard__chart-canvas">
        <Line {...config} />
      </div>
    </section>
  );
}
