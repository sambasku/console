import { theme, Typography } from 'antd';
import type { ProblemsStats } from '../../domain/dashboard-stats';

export interface ProblemsDonutChartProps {
  problems: ProblemsStats;
  onNavigate?: () => void;
}

const SIZE = 180;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 72;
const R_INNER = 44;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Arc path untuk slice donut dari startAngle ke endAngle (derajat). */
function donutSlice(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
): string {
  const large = endAngle - startAngle > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOuter, startAngle);
  const o2 = polar(cx, cy, rOuter, endAngle);
  const i1 = polar(cx, cy, rInner, endAngle);
  const i2 = polar(cx, cy, rInner, startAngle);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
}

/**
 * Donut snapshot permasalahan: belum (open) vs selesai (closed).
 */
export function ProblemsDonutChart({ problems, onNavigate }: ProblemsDonutChartProps) {
  const { token } = theme.useToken();
  const total = problems.open + problems.closed;
  const openColor = token.colorWarning;
  const closedColor = token.colorSuccess;

  let openPath = '';
  let closedPath = '';
  if (total === 0) {
    openPath = donutSlice(CX, CY, R_OUTER, R_INNER, 0, 359.99);
  } else if (problems.open === 0) {
    closedPath = donutSlice(CX, CY, R_OUTER, R_INNER, 0, 359.99);
  } else if (problems.closed === 0) {
    openPath = donutSlice(CX, CY, R_OUTER, R_INNER, 0, 359.99);
  } else {
    const openSweep = (problems.open / total) * 360;
    openPath = donutSlice(CX, CY, R_OUTER, R_INNER, 0, openSweep);
    closedPath = donutSlice(CX, CY, R_OUTER, R_INNER, openSweep, 360);
  }

  const body = (
    <>
      <div className="dashboard__donut-header">
        <Typography.Title level={5} className="dashboard__chart-title">
          Permasalahan
        </Typography.Title>
        <Typography.Text type="secondary" className="dashboard__chart-subtitle">
          Bug {problems.bySource.bugReports.open + problems.bySource.bugReports.closed} · Kata{' '}
          {problems.bySource.wordReports.open + problems.bySource.wordReports.closed}
        </Typography.Text>
      </div>

      <div className="dashboard__donut-visual">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="dashboard__donut-svg"
          role="img"
          aria-label={`Donut permasalahan: ${problems.open} belum, ${problems.closed} selesai`}
        >
          {total === 0 ? (
            <path d={openPath} fill={token.colorFillSecondary} />
          ) : (
            <>
              {openPath ? <path d={openPath} fill={openColor} /> : null}
              {closedPath ? <path d={closedPath} fill={closedColor} /> : null}
            </>
          )}
          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            fontSize={22}
            fontWeight={600}
            fill={token.colorText}
          >
            {total.toLocaleString('id-ID')}
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize={11} fill={token.colorTextSecondary}>
            total
          </text>
        </svg>

        <ul className="dashboard__donut-legend" aria-label="Legenda permasalahan">
          <li className="dashboard__chart-legend-item">
            <span
              className="dashboard__chart-legend-swatch"
              style={{ background: openColor }}
              aria-hidden
            />
            Belum{' '}
            <span className="dashboard__chart-legend-total">
              ({problems.open.toLocaleString('id-ID')})
            </span>
          </li>
          <li className="dashboard__chart-legend-item">
            <span
              className="dashboard__chart-legend-swatch"
              style={{ background: closedColor }}
              aria-hidden
            />
            Selesai{' '}
            <span className="dashboard__chart-legend-total">
              ({problems.closed.toLocaleString('id-ID')})
            </span>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <section className="dashboard__chart dashboard__donut">
      {onNavigate ? (
        <button
          type="button"
          className="dashboard__donut-body dashboard__donut-body--clickable"
          onClick={onNavigate}
          aria-label={`Permasalahan: ${problems.open} belum, ${problems.closed} selesai. Buka laporan bug.`}
        >
          {body}
        </button>
      ) : (
        <div className="dashboard__donut-body">{body}</div>
      )}
    </section>
  );
}
