import type { KaryaViewsReport } from '../infrastructure/karya-api';

export function fillTrendDays(
  report: KaryaViewsReport,
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

export interface KaryaViewsKpis {
  totalViews: number;
  topTitle: string | null;
  topViews: number;
  activeKarya: number;
  avgViews: number;
}

export function toKaryaViewsKpis(report: KaryaViewsReport): KaryaViewsKpis {
  const total = report.items.reduce((s, i) => s + i.views, 0);
  const top = report.items[0];
  return {
    totalViews: total,
    topTitle: top?.title ?? null,
    topViews: top?.views ?? 0,
    activeKarya: report.items.length,
    avgViews: report.items.length > 0 ? Math.round(total / report.items.length) : 0,
  };
}