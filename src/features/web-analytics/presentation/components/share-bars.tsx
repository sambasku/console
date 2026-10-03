import { theme, Typography } from 'antd';
import { fmtInt, fmtRatio } from '../format';

export interface ShareBarRow {
  key: string;
  label: string;
  value: number;
}

/** Bar horizontal porsi (%) - lebih mudah dibaca daripada pie untuk 3-5 kategori. */
export function ShareBars({ title, rows, unit }: { title: string; rows: ShareBarRow[]; unit: string }) {
  const { token } = theme.useToken();
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <section className="dashboard__chart" aria-label={title}>
      <div className="dashboard__bars-header">
        <Typography.Title level={5} className="dashboard__chart-title">
          {title}
        </Typography.Title>
      </div>
      <ul className="dashboard__bars-list traffic__share-list">
        {rows.map((r) => {
          const share = total > 0 ? r.value / total : 0;
          return (
            <li key={r.key} className="dashboard__bars-row traffic__share-row">
              <span className="dashboard__bars-label">{r.label}</span>
              <span className="dashboard__bars-track">
                <span
                  className="dashboard__bars-fill"
                  style={{ width: `${share * 100}%`, background: token.colorPrimary }}
                />
              </span>
              <span className="dashboard__bars-value">{fmtRatio(share)}</span>
              <span className="traffic__share-count">
                {fmtInt(r.value)} {unit}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
