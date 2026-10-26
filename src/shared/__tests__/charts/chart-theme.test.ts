import { describe, expect, it } from 'vitest';
import {
  CHART_PALETTE,
  buildTrendConfig,
  seriesColor,
  type ChartRow,
} from '../../charts/chart-theme';

describe('CHART_PALETTE', () => {
  it('berisi 8 warna unik (cegah regresi Kontribusi = User baru)', () => {
    const lower = CHART_PALETTE.map((c) => c.toLowerCase());
    expect(lower).toHaveLength(8);
    expect(new Set(lower).size).toBe(lower.length);
  });

  it('5 series Ringkasan dapat warna berbeda semua', () => {
    const five = [0, 1, 2, 3, 4].map(seriesColor);
    expect(new Set(five).size).toBe(5);
  });
});

describe('buildTrendConfig', () => {
  it('children eksplisit: area tipis + line solid, tanpa mark default G2', () => {
    const data: ChartRow[] = [
      { date: '2026-10-01', dateLabel: '1/10', series: 'A', value: 1 },
      { date: '2026-10-01', dateLabel: '1/10', series: 'B', value: 2 },
    ];
    const cfg = buildTrendConfig({
      data,
      colors: ['#111111', '#222222'],
      height: 200,
      tooltip: { title: (d) => d.date, items: [] },
    }) as {
      children: Array<{ type: string; style?: Record<string, unknown> }>;
    };
    // Default Area v2 `children: [{type:'area'}]` = fill biru solid G2.
    // Config wajib mendefinisikan children sendiri (area + line) agar
    // menimpa default itu - jangan sampai regresi ke key `area:` lama.
    expect(cfg.children.map((c) => c.type)).toEqual(['area', 'line']);
    const area = cfg.children[0].style as {
      fill: (d: { series: string }) => string;
      fillOpacity: number;
    };
    expect(area.fill({ series: 'A' })).toBe('#111111');
    expect(area.fill({ series: 'B' })).toBe('#222222');
    expect(area.fillOpacity).toBeLessThanOrEqual(0.1);
  });
});
