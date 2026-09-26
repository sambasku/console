import { useId, useMemo, useState } from 'react';
import { theme, Typography } from 'antd';
import type { ActivityDailyPoint } from '../../domain/dashboard-stats';

export interface ActivityDailyChartProps {
  points: ActivityDailyPoint[];
}

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 36, left: 40 };

type SeriesKey = 'contributions' | 'votes' | 'comments' | 'newUsers';

const SERIES: Array<{ key: SeriesKey; label: string }> = [
  { key: 'contributions', label: 'Kontribusi' },
  { key: 'votes', label: 'Vote' },
  { key: 'comments', label: 'Komentar' },
  { key: 'newUsers', label: 'User baru' },
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

function buildLinePath(
  points: ActivityDailyPoint[],
  key: SeriesKey,
  xAt: (i: number) => number,
  yAt: (count: number) => number,
): string {
  return points
    .map((p, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      return `${cmd}${xAt(i).toFixed(1)},${yAt(p[key]).toFixed(1)}`;
    })
    .join(' ');
}

/**
 * Line chart multi-series (SVG) - kontribusi, vote, komentar, user baru.
 * Tanpa lib chart; 30 titik tetap untuk layout stabil.
 */
export function ActivityDailyChart({ points }: ActivityDailyChartProps) {
  const { token } = theme.useToken();
  const gradientId = useId().replace(/:/g, '');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const colors: Record<SeriesKey, string> = {
    contributions: token.colorPrimary,
    votes: token.colorSuccess,
    comments: token.colorWarning,
    newUsers: token.colorInfo,
  };

  const { paths, yTicks, xLabels, maxCount, plot } = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const max = Math.max(
      1,
      ...points.flatMap((p) => [p.contributions, p.votes, p.comments, p.newUsers]),
    );
    const n = Math.max(points.length, 1);

    const xAt = (i: number) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yAt = (count: number) => PAD.top + innerH - (count / max) * innerH;

    const linePaths = Object.fromEntries(
      SERIES.map((s) => [s.key, buildLinePath(points, s.key, xAt, yAt)]),
    ) as Record<SeriesKey, string>;

    // Area fill hanya untuk kontribusi (series utama)
    const contribCoords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.contributions) }));
    const areaPath =
      contribCoords.length === 0
        ? ''
        : `${linePaths.contributions} L${contribCoords[contribCoords.length - 1]!.x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${contribCoords[0]!.x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

    const tickCount = 4;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const value = Math.round((max * (tickCount - i)) / tickCount);
      return { value, y: yAt(value) };
    });

    const labelIndexes = new Set<number>();
    if (n > 0) {
      labelIndexes.add(0);
      labelIndexes.add(n - 1);
      for (const frac of [0.25, 0.5, 0.75]) {
        labelIndexes.add(Math.round((n - 1) * frac));
      }
    }
    const labels = [...labelIndexes]
      .sort((a, b) => a - b)
      .map((i) => ({
        i,
        x: xAt(i),
        text: points[i] ? formatDayLabel(points[i]!.date) : '',
      }));

    return {
      paths: { ...linePaths, area: areaPath },
      yTicks: ticks,
      xLabels: labels,
      maxCount: max,
      plot: { innerW, innerH, xAt, yAt },
    };
  }, [points]);

  const hover = hoverIndex != null ? points[hoverIndex] : null;
  const hoverX = hoverIndex != null ? plot.xAt(hoverIndex) : null;

  const totals = useMemo(
    () => ({
      contributions: points.reduce((s, p) => s + p.contributions, 0),
      votes: points.reduce((s, p) => s + p.votes, 0),
      comments: points.reduce((s, p) => s + p.comments, 0),
      newUsers: points.reduce((s, p) => s + p.newUsers, 0),
    }),
    [points],
  );

  return (
    <section className="dashboard__chart" aria-label="Aktivitas harian 30 hari terakhir">
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            Aktivitas harian
          </Typography.Title>
          <Typography.Text type="secondary" className="dashboard__chart-subtitle">
            30 hari terakhir (WIB)
          </Typography.Text>
          <ul className="dashboard__chart-legend" aria-label="Legenda series">
            {SERIES.map((s) => (
              <li key={s.key} className="dashboard__chart-legend-item">
                <span
                  className="dashboard__chart-legend-swatch"
                  style={{ background: colors[s.key] }}
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
        {hover ? (
          <div className="dashboard__chart-tooltip" role="status">
            <span className="dashboard__chart-tooltip-date">{formatFullDate(hover.date)}</span>
            {SERIES.map((s) => (
              <span key={s.key} className="dashboard__chart-tooltip-row">
                <span
                  className="dashboard__chart-legend-swatch"
                  style={{ background: colors[s.key] }}
                  aria-hidden
                />
                {s.label}: {hover[s.key].toLocaleString('id-ID')}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="dashboard__chart-canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Grafik aktivitas harian, puncak ${maxCount}`}
          className="dashboard__chart-svg"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.contributions} stopOpacity={0.18} />
              <stop offset="100%" stopColor={colors.contributions} stopOpacity={0} />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={`y-${tick.value}-${tick.y}`}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={tick.y}
                y2={tick.y}
                stroke={token.colorBorderSecondary}
                strokeDasharray="3 4"
              />
              <text
                x={PAD.left - 8}
                y={tick.y + 3}
                textAnchor="end"
                fontSize={10}
                fill={token.colorTextSecondary}
              >
                {tick.value}
              </text>
            </g>
          ))}

          {paths.area ? <path d={paths.area} fill={`url(#${gradientId})`} /> : null}

          {SERIES.map((s) => (
            <path
              key={s.key}
              d={paths[s.key]}
              fill="none"
              stroke={colors[s.key]}
              strokeWidth={s.key === 'contributions' ? 2.25 : 1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {xLabels.map((label) => (
            <text
              key={`x-${label.i}`}
              x={label.x}
              y={HEIGHT - 10}
              textAnchor="middle"
              fontSize={10}
              fill={token.colorTextSecondary}
            >
              {label.text}
            </text>
          ))}

          {hover && hoverX != null ? (
            <>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={PAD.top}
                y2={PAD.top + plot.innerH}
                stroke={token.colorTextSecondary}
                strokeOpacity={0.35}
                strokeDasharray="2 3"
              />
              {SERIES.map((s) => (
                <circle
                  key={s.key}
                  cx={hoverX}
                  cy={plot.yAt(hover[s.key])}
                  r={3.5}
                  fill={token.colorBgContainer}
                  stroke={colors[s.key]}
                  strokeWidth={2}
                />
              ))}
            </>
          ) : null}

          {points.map((point, i) => {
            const x = plot.xAt(i);
            const half =
              points.length <= 1 ? plot.innerW / 2 : plot.innerW / (2 * (points.length - 1));
            return (
              <rect
                key={point.date}
                x={x - half}
                y={PAD.top}
                width={Math.max(half * 2, 8)}
                height={plot.innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                tabIndex={0}
                role="listitem"
                aria-label={`${formatFullDate(point.date)}: kontribusi ${point.contributions}, vote ${point.votes}, komentar ${point.comments}, user baru ${point.newUsers}`}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
}
