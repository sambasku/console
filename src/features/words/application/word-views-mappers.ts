import type { WordViewsReport } from '../infrastructure/word-api';

/**
 * Deret tren dengan hari kosong diisi 0 supaya sumbu-x chart utuh.
 * `nowMs` bisa diinjeksi supaya hasil deterministik di test.
 */
export function fillTrendDays(
  report: WordViewsReport,
  days: number,
  nowMs: number = Date.now(),
): Array<{ day: string; total: number }> {
  const byDay = new Map(report.trend.map((p) => [p.day, p.total]));
  const out: Array<{ day: string; total: number }> = [];
  const offset = (days - 1) * 24 * 60 * 60 * 1000;
  const start = new Date(nowMs - offset);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    out.push({ day: key, total: byDay.get(key) ?? 0 });
  }
  return out;
}

export interface WordViewsKpis {
  totalViews: number;
  topLemma: string | null;
  topViews: number;
  activeWords: number;
  avgViews: number;
}

export function toWordViewsKpis(report: WordViewsReport): WordViewsKpis {
  const total = report.items.reduce((s, i) => s + i.views, 0);
  const top = report.items[0];
  return {
    totalViews: total,
    topLemma: top?.lemma ?? null,
    topViews: top?.views ?? 0,
    activeWords: report.items.length,
    avgViews: report.items.length > 0 ? Math.round(total / report.items.length) : 0,
  };
}