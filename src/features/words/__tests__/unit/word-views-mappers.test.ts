import { describe, expect, it } from 'vitest';
import { fillTrendDays, toWordViewsKpis } from '../../application/word-views-mappers';
import type { WordViewsReport } from '../../infrastructure/word-api';

const report: WordViewsReport = {
  trend: [{ day: '2026-10-20', total: 12 }],
  items: [
    {
      wordId: 'w1',
      lemma: 'makatn',
      views: 20,
      lastViewed: '2026-10-20',
    },
    {
      wordId: 'w2',
      lemma: 'antre',
      views: 5,
      lastViewed: '2026-10-19',
    },
  ],
};

describe('fillTrendDays', () => {
  it('mengisi hari kosong dengan 0 (WIB)', () => {
    const now = Date.parse('2026-10-22T10:00:00+07:00');
    const trend = fillTrendDays(report, 7, now);
    expect(trend).toHaveLength(7);
    expect(trend.reduce((s, p) => s + p.total, 0)).toBe(12);
    expect(trend.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.day))).toBe(true);
  });
});

describe('toWordViewsKpis', () => {
  it('total, top, aktif, rata-rata', () => {
    const kpis = toWordViewsKpis(report);
    expect(kpis.totalViews).toBe(25);
    expect(kpis.topLemma).toBe('makatn');
    expect(kpis.topViews).toBe(20);
    expect(kpis.activeWords).toBe(2);
    expect(kpis.avgViews).toBe(13);
  });
});