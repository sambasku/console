import { Typography } from 'antd';

export interface StatusBarRow {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface StatusBarsPanelProps {
  title: string;
  subtitle: string;
  rows: StatusBarRow[];
  /** Dipakai untuk % bar; default = sum(rows). */
  total?: number;
  onNavigate?: () => void;
  ariaLabel: string;
}

/**
 * Breakdown status gaya Cloudflare: label + bar tipis + angka.
 */
export function StatusBarsPanel({
  title,
  subtitle,
  rows,
  total: totalProp,
  onNavigate,
  ariaLabel,
}: StatusBarsPanelProps) {
  const total = totalProp ?? rows.reduce((sum, row) => sum + row.value, 0);

  const body = (
    <>
      <div className="dashboard__bars-header">
        <Typography.Title level={5} className="dashboard__chart-title">
          {title}
        </Typography.Title>
        <Typography.Text type="secondary" className="dashboard__chart-subtitle">
          {subtitle}
        </Typography.Text>
      </div>

      <ul className="dashboard__bars-list" aria-label={ariaLabel}>
        {rows.map((row) => {
          const pct = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <li key={row.key} className="dashboard__bars-row">
              <span className="dashboard__bars-label">{row.label}</span>
              <div className="dashboard__bars-track" aria-hidden>
                <span
                  className="dashboard__bars-fill"
                  style={{
                    width: row.value > 0 ? `${Math.max(pct, 2)}%` : '0%',
                    background: row.color,
                  }}
                />
              </div>
              <span className="dashboard__bars-value">{row.value.toLocaleString('id-ID')}</span>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <section className="dashboard__chart dashboard__bars">
      {onNavigate ? (
        <button
          type="button"
          className="dashboard__bars-body dashboard__bars-body--clickable"
          onClick={onNavigate}
          aria-label={ariaLabel}
        >
          {body}
        </button>
      ) : (
        <div className="dashboard__bars-body">{body}</div>
      )}
    </section>
  );
}
