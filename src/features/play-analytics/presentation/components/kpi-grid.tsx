import { deltaTone, formatPercentChange, percentChange } from '@/features/web-analytics/domain/date-range';
import { fmtRating } from './format';

export interface PlayKpiItem {
  key: string;
  label: string;
  value: number;
  previous: number;
  format?: (n: number) => string;
}

/** KPI Play + perubahan vs periode sebelumnya; gaya kartu KPI Ringkasan. */
export function KpiGrid({ items }: { items: PlayKpiItem[] }) {
  return (
    <div className="dashboard__kpi traffic__kpi" role="list">
      {items.map((item) => {
        const format = item.format ?? ((n: number) => fmtRating(n));
        const change = percentChange(item.value, item.previous);
        const tone = deltaTone(change);
        return (
          <div key={item.key} role="listitem" className="dashboard__kpi-cell">
            <div className="dashboard__kpi-card">
              <span className="dashboard__kpi-label">{item.label}</span>
              <span className="dashboard__kpi-value">{format(item.value)}</span>
              <span className="dashboard__kpi-meta">
                <span className={`dashboard__today-delta dashboard__today-delta--${tone}`}>
                  {formatPercentChange(change)}
                </span>{' '}
                vs periode sebelumnya
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
