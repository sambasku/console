import type { ActivityDailyPoint } from '../../domain/dashboard-stats';
import { buildTodayVsYesterday, formatDelta } from '../../application/today-vs-yesterday';

export interface TodayVsYesterdayProps {
  points: ActivityDailyPoint[];
}

/**
 * Strip satu baris: label + angka hari ini + delta vs kemarin.
 */
export function TodayVsYesterday({ points }: TodayVsYesterdayProps) {
  const metrics = buildTodayVsYesterday(points);

  return (
    <section className="dashboard__today" aria-label="Hari ini dibanding kemarin">
      <span className="dashboard__today-title">Hari ini</span>
      <ul className="dashboard__today-list">
        {metrics.map((m, index) => {
          const trend =
            m.delta === null ? 'flat' : m.delta > 0 ? 'up' : m.delta < 0 ? 'down' : 'flat';
          return (
            <li key={m.key} className="dashboard__today-item">
              {index > 0 ? (
                <span className="dashboard__today-sep" aria-hidden>
                  ·
                </span>
              ) : null}
              <span className="dashboard__today-label">{m.label}</span>
              <span className="dashboard__today-value">{m.today.toLocaleString('id-ID')}</span>
              {m.delta !== null ? (
                <span
                  className={`dashboard__today-delta dashboard__today-delta--${trend}`}
                  title={
                    m.yesterday === null
                      ? undefined
                      : `Kemarin ${m.yesterday.toLocaleString('id-ID')}`
                  }
                >
                  {formatDelta(m.delta)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
