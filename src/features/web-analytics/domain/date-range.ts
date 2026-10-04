import {
  RANGE_PRESETS,
  WEB_ANALYTICS_SECTIONS,
  type RangePreset,
  type RangeQuery,
  type WebAnalyticsSection,
} from './web-analytics';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export interface TrafficSearch {
  tab: WebAnalyticsSection;
  range: RangePreset;
  start?: string;
  end?: string;
}

/** Search params `/dashboard/traffic` - nilai asing jatuh ke default (Ikhtisar, 28 hari). */
export function parseTrafficSearch(search: Record<string, unknown>): TrafficSearch {
  const tab = WEB_ANALYTICS_SECTIONS.includes(search.tab as WebAnalyticsSection)
    ? (search.tab as WebAnalyticsSection)
    : 'overview';
  const start = typeof search.start === 'string' && YMD.test(search.start) ? search.start : undefined;
  const end = typeof search.end === 'string' && YMD.test(search.end) ? search.end : undefined;
  const preset = RANGE_PRESETS.includes(search.range as RangePreset) ? (search.range as RangePreset) : '28d';
  // custom tanpa tanggal lengkap tidak bisa dipakai - balik ke default.
  if (preset === 'custom' && (!start || !end || start > end)) {
    return { tab, range: '28d' };
  }
  return preset === 'custom' ? { tab, range: preset, start, end } : { tab, range: preset };
}

export function toRangeQuery(search: TrafficSearch): RangeQuery {
  return search.range === 'custom'
    ? { range: 'custom', start: search.start, end: search.end }
    : { range: search.range };
}

/** Persen perubahan vs periode sebelumnya. `null` kalau pembanding 0 (tidak bermakna). */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export type DeltaTone = 'up' | 'down' | 'flat';

/**
 * Warna delta: `up` = membaik. Untuk metrik yang makin kecil makin bagus
 * (posisi rata-rata pencarian) pakai `lowerIsBetter`.
 */
export function deltaTone(change: number | null, lowerIsBetter = false): DeltaTone {
  if (change === null || Math.abs(change) < 0.05) return 'flat';
  const improved = lowerIsBetter ? change < 0 : change > 0;
  return improved ? 'up' : 'down';
}

export function formatPercentChange(change: number | null): string {
  if (change === null) return 'tidak ada pembanding';
  if (Math.abs(change) < 0.05) return 'stabil';
  const arrow = change > 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(change).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
}

export function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatRangeLabel(range: { start: string; end: string }): string {
  return `${formatYmd(range.start)} - ${formatYmd(range.end)}`;
}

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  '7d': '7 hari',
  '28d': '28 hari',
  '90d': '90 hari',
  custom: 'Custom',
};
