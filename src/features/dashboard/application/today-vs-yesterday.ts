import type { ActivityDailyPoint } from '../domain/dashboard-stats';

export type TodayMetricKey = 'contributions' | 'votes' | 'comments' | 'newUsers';

export interface TodayVsYesterdayMetric {
  key: TodayMetricKey;
  label: string;
  today: number;
  yesterday: number | null;
  delta: number | null;
}

const METRICS: Array<{ key: TodayMetricKey; label: string }> = [
  { key: 'contributions', label: 'Kontribusi' },
  { key: 'votes', label: 'Vote' },
  { key: 'comments', label: 'Komentar' },
  { key: 'newUsers', label: 'User baru' },
];

/**
 * Bandingkan titik terakhir (hari ini WIB) dengan hari sebelumnya.
 * Kurang dari 2 titik → delta null (sembunyikan perbandingan).
 */
export function buildTodayVsYesterday(points: ActivityDailyPoint[]): TodayVsYesterdayMetric[] {
  if (points.length === 0) {
    return METRICS.map((m) => ({
      key: m.key,
      label: m.label,
      today: 0,
      yesterday: null,
      delta: null,
    }));
  }

  const todayPoint = points[points.length - 1];
  const yesterdayPoint = points.length >= 2 ? points[points.length - 2] : null;

  return METRICS.map((m) => {
    const today = todayPoint[m.key];
    const yesterday = yesterdayPoint ? yesterdayPoint[m.key] : null;
    return {
      key: m.key,
      label: m.label,
      today,
      yesterday,
      delta: yesterday === null ? null : today - yesterday,
    };
  });
}

export function formatDelta(delta: number): string {
  if (delta === 0) return '0';
  const abs = Math.abs(delta).toLocaleString('id-ID');
  return delta > 0 ? `+${abs}` : `-${abs}`;
}
