import { deltaTone, formatPercentChange, percentChange } from '../../domain/date-range';

export interface KpiItem {
  key: string;
  label: string;
  value: number;
  previous: number;
  format: (n: number) => string;
  /** Posisi rata-rata pencarian: makin kecil makin bagus. */
  lowerIsBetter?: boolean;
}

/** KPI + perubahan vs periode sebelumnya. Memakai gaya kartu KPI Ringkasan. */
export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="dashboard__kpi traffic__kpi" role="list">
      {items.map((item) => {
        const change = percentChange(item.value, item.previous);
        const tone = deltaTone(change, item.lowerIsBetter);
        return (
          <div key={item.key} role="listitem" className="dashboard__kpi-cell">
            <div className="dashboard__kpi-card">
              <span className="dashboard__kpi-label">{item.label}</span>
              <span className="dashboard__kpi-value">{item.format(item.value)}</span>
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
