import { useMemo } from 'react';
import { Pie } from '@ant-design/plots';
import { theme, Typography } from 'antd';
import type { VerifierApplicationsStats } from '../../domain/dashboard-stats';

export interface VerifierApplicationsDonutChartProps {
  stats: VerifierApplicationsStats;
  onNavigate?: () => void;
}

/**
 * Donut pengajuan verifikator: menunggu / disetujui / ditolak.
 */
export function VerifierApplicationsDonutChart({
  stats,
  onNavigate,
}: VerifierApplicationsDonutChartProps) {
  const { token } = theme.useToken();
  const total = stats.pending + stats.approved + stats.rejected;

  const data = useMemo(
    () => [
      { type: 'Menunggu', value: stats.pending },
      { type: 'Disetujui', value: stats.approved },
      { type: 'Ditolak', value: stats.rejected },
    ],
    [stats.pending, stats.approved, stats.rejected],
  );

  const config = useMemo(
    () => ({
      data: total === 0 ? [{ type: 'Kosong', value: 1 }] : data.filter((d) => d.value > 0),
      angleField: 'value',
      colorField: 'type',
      innerRadius: 0.62,
      autoFit: true,
      height: 200,
      scale: {
        color: {
          range:
            total === 0
              ? [token.colorFillSecondary]
              : [token.colorWarning, token.colorSuccess, token.colorError],
          domain: total === 0 ? ['Kosong'] : ['Menunggu', 'Disetujui', 'Ditolak'],
        },
      },
      legend: false,
      label: false,
      tooltip: total === 0 ? false : { title: 'type', items: [{ channel: 'y' }] },
      interaction: {
        elementHighlight: true,
      },
    }),
    [data, total, token.colorFillSecondary, token.colorWarning, token.colorSuccess, token.colorError],
  );

  const body = (
    <>
      <div className="dashboard__donut-header">
        <Typography.Title level={5} className="dashboard__chart-title">
          Pengajuan verifikator
        </Typography.Title>
        <Typography.Text type="secondary" className="dashboard__chart-subtitle">
          Snapshot status pengajuan
        </Typography.Text>
      </div>

      <div className="dashboard__donut-visual">
        <div className="dashboard__donut-plot">
          <Pie {...config} />
          <div className="dashboard__donut-center" aria-hidden>
            <span className="dashboard__donut-center-value">{total.toLocaleString('id-ID')}</span>
            <span className="dashboard__donut-center-label">total</span>
          </div>
        </div>

        <ul className="dashboard__donut-legend" aria-label="Legenda pengajuan verifikator">
          <li className="dashboard__chart-legend-item">
            <span
              className="dashboard__chart-legend-swatch"
              style={{ background: token.colorWarning }}
              aria-hidden
            />
            Menunggu{' '}
            <span className="dashboard__chart-legend-total">
              ({stats.pending.toLocaleString('id-ID')})
            </span>
          </li>
          <li className="dashboard__chart-legend-item">
            <span
              className="dashboard__chart-legend-swatch"
              style={{ background: token.colorSuccess }}
              aria-hidden
            />
            Disetujui{' '}
            <span className="dashboard__chart-legend-total">
              ({stats.approved.toLocaleString('id-ID')})
            </span>
          </li>
          <li className="dashboard__chart-legend-item">
            <span
              className="dashboard__chart-legend-swatch"
              style={{ background: token.colorError }}
              aria-hidden
            />
            Ditolak{' '}
            <span className="dashboard__chart-legend-total">
              ({stats.rejected.toLocaleString('id-ID')})
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
          aria-label={`Pengajuan verifikator: ${stats.pending} menunggu, ${stats.approved} disetujui, ${stats.rejected} ditolak.`}
        >
          {body}
        </button>
      ) : (
        <div className="dashboard__donut-body">{body}</div>
      )}
    </section>
  );
}
