import { describe, expect, it } from 'vitest';
import { fillTrendDays, toPlaceViewsKpis } from '../../application/place-views-mappers';
import type { PlaceViewsReport } from '../../infrastructure/place-api';

const report: PlaceViewsReport = {
  trend: [{ day: '2026-10-20', total: 12 }],
  items: [
    {
      placeId: 'p1',
      name: 'Pantai A',
      slug: 'pantai-a',
      category: 'wisata',
      views: 20,
      lastViewed: '2026-10-20',
    },
    {
      placeId: 'p2',
      name: 'Bukit B',
      slug: 'bukit-b',
      category: 'wisata',
      views: 5,
      lastViewed: '2026-10-19',
    },
  ],
};

describe('fillTrendDays', () => {
  it('mengisi hari kosong dengan 0 (WIB)', () => {
    // Waktu dipatok supaya 2026-10-20 masuk jendela 7 hari (test deterministik).
    const now = Date.parse('2026-10-22T10:00:00+07:00');
    const trend = fillTrendDays(report, 7, now);
    expect(trend).toHaveLength(7);
    expect(trend.reduce((s, p) => s + p.total, 0)).toBe(12);
    expect(trend.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.day))).toBe(true);
  });
});

describe('toPlaceViewsKpis', () => {
  it('total, top, aktif, rata-rata', () => {
    const kpis = toPlaceViewsKpis(report);
    expect(kpis).toEqual({
      totalViews: 25,
      topName: 'Pantai A',
      topViews: 20,
      activePlaces: 2,
      avgViews: 13,
    });
  });

  it('laporan kosong = nol semua, tanpa NaN', () => {
    expect(toPlaceViewsKpis({ trend: [], items: [] })).toEqual({
      totalViews: 0,
      topName: null,
      topViews: 0,
      activePlaces: 0,
      avgViews: 0,
    });
  });
});
