import { useMemo } from 'react';
import { Pie } from '@ant-design/plots';
import { theme, Typography } from 'antd';
import {
  WORD_STATUS_LABELS,
  type DashboardStats,
  type WordStatusKey,
} from '../../domain/dashboard-stats';

export interface WordsStatusDonutChartProps {
  words: DashboardStats['words'];
  onNavigate?: () => void;
}

const STATUS_ORDER: WordStatusKey[] = ['pending_review', 'draft', 'published', 'rejected'];

/**
 * Donut status kata - pending_review / draft / published / rejected.
 */
export function WordsStatusDonutChart({ words, onNavigate }: WordsStatusDonutChartProps) {
  const { token } = theme.useToken();
  const byStatus = words.byStatus;
  const total = STATUS_ORDER.reduce((sum, key) => sum + (byStatus[key] ?? 0), 0);
  const pendingReview = byStatus.pending_review ?? 0;

  const colorByStatus: Record<WordStatusKey, string> = useMemo(
    () => ({
      pending_review: token.colorWarning,
      draft: token.colorTextQuaternary,
      published: token.colorSuccess,
      rejected: token.colorError,
    }),
    [token.colorWarning, token.colorTextQuaternary, token.colorSuccess, token.colorError],
  );

  const data = useMemo(
    () =>
      STATUS_ORDER.map((key) => ({
        type: WORD_STATUS_LABELS[key],
        value: byStatus[key] ?? 0,
        key,
      })),
    [
      byStatus.pending_review,
      byStatus.draft,
      byStatus.published,
      byStatus.rejected,
    ],
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
              : STATUS_ORDER.filter((k) => (byStatus[k] ?? 0) > 0).map((k) => colorByStatus[k]),
          domain:
            total === 0
              ? ['Kosong']
              : STATUS_ORDER.filter((k) => (byStatus[k] ?? 0) > 0).map((k) => WORD_STATUS_LABELS[k]),
        },
      },
      legend: false,
      label: false,
      tooltip: total === 0 ? false : { title: 'type', items: [{ channel: 'y' }] },
      interaction: {
        elementHighlight: true,
      },
    }),
    [
      byStatus.pending_review,
      byStatus.draft,
      byStatus.published,
      byStatus.rejected,
      colorByStatus,
      data,
      total,
      token.colorFillSecondary,
    ],
  );

  const body = (
    <>
      <div className="dashboard__donut-header">
        <Typography.Title level={5} className="dashboard__chart-title">
          Status kata
        </Typography.Title>
        <Typography.Text type="secondary" className="dashboard__chart-subtitle">
          {pendingReview > 0
            ? `${pendingReview.toLocaleString('id-ID')} menunggu review`
            : 'Snapshot status katalog'}
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

        <ul className="dashboard__donut-legend" aria-label="Legenda status kata">
          {STATUS_ORDER.map((key) => (
            <li key={key} className="dashboard__chart-legend-item">
              <span
                className="dashboard__chart-legend-swatch"
                style={{ background: colorByStatus[key] }}
                aria-hidden
              />
              {WORD_STATUS_LABELS[key]}{' '}
              <span className="dashboard__chart-legend-total">
                ({(byStatus[key] ?? 0).toLocaleString('id-ID')})
              </span>
            </li>
          ))}
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
          aria-label={`Status kata: ${pendingReview} menunggu review dari ${total} total. Buka daftar kata.`}
        >
          {body}
        </button>
      ) : (
        <div className="dashboard__donut-body">{body}</div>
      )}
    </section>
  );
}
