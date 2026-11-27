import type { LayananViewsReport } from '../infrastructure/layanan-api';

export function fillTrendDays(
  report: LayananViewsReport,
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

export interface LayananViewsKpis {
  totalViews: number;
  topName: string | null;
  topViews: number;
  activeLayanan: number;
  avgViews: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  ambulance: 'Ambulans',
  fire: 'Pemadam',
};

export function layananCategoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}

export function toLayananViewsKpis(report: LayananViewsReport): LayananViewsKpis {
  const total = report.items.reduce((s, i) => s + i.views, 0);
  const top = report.items[0];
  return {
    totalViews: total,
    topName: top?.name ?? null,
    topViews: top?.views ?? 0,
    activeLayanan: report.items.length,
    avgViews: report.items.length > 0 ? Math.round(total / report.items.length) : 0,
  };
}