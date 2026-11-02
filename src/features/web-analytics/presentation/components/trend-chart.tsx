import { useMemo } from 'react';
import { Area } from '@ant-design/plots';
import { Typography } from 'antd';
import { formatYmd } from '../../domain/date-range';
import { buildTrendConfig, seriesColor, type ChartRow } from '@/shared/charts/chart-theme';

export interface TrendSeries<K extends string> {
  key: K;
  label: string;
}

export interface TrendChartProps<K extends string> {
  title: string;
  subtitle?: string;
  points: Array<{ date: string } & Record<K, number>>;
  series: Array<TrendSeries<K>>;
  height?: number;
}

function dayLabel(ymd: string): string {
  const [, month, day] = ymd.split('-');
  return `${Number(day)}/${Number(month)}`;
}

/**
 * Area chart tren harian gaya Cloudflare - pola sama ActivityDailyChart:
 * smooth curves, gradient area, grid tipis, tooltip crosshair + marker.
 * Dipakai untuk tren web analytics, play, dan FCM.
 */
export function TrendChart<K extends string>({
  title,
  subtitle,
  points,
  series,
  height = 240,
}: TrendChartProps<K>) {
  const colors = useMemo(() => series.map((_, i) => seriesColor(i)), [series]);

  const data = useMemo<ChartRow[]>(() => {
    const rows: ChartRow[] = [];
    for (const p of points) {
      for (const s of series) {
        rows.push({
          date: p.date,
          dateLabel: dayLabel(p.date),
          series: s.label,
          value: p[s.key],
        });
      }
    }
    return rows;
  }, [points, series]);

  const config = useMemo(
    () =>
      buildTrendConfig({
        data,
        colors,
        height,
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
                  <span
                    className="dashboard__chart-legend-swatch"
                    style={{ background: colors[i] }}
                    aria-hidden
                  />
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="dashboard__chart-canvas">
        <Area {...config} />
      </div>
    </section>
  );
}
