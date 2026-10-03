import { describe, expect, it } from 'vitest';
import {
  deltaTone,
  formatPercentChange,
  parseTrafficSearch,
  percentChange,
  toRangeQuery,
} from '../../domain/date-range';

describe('parseTrafficSearch', () => {
  it('default: Ikhtisar 28 hari', () => {
    expect(parseTrafficSearch({})).toEqual({ tab: 'overview', range: '28d' });
  });

  it('tab & preset valid dipertahankan, nilai asing jatuh ke default', () => {
    expect(parseTrafficSearch({ tab: 'search', range: '90d' })).toEqual({ tab: 'search', range: '90d' });
    expect(parseTrafficSearch({ tab: 'ga4', range: '1y' })).toEqual({ tab: 'overview', range: '28d' });
  });

  it('custom butuh start <= end yang valid', () => {
    expect(parseTrafficSearch({ range: 'custom', start: '2026-09-01', end: '2026-09-10' })).toEqual({
      tab: 'overview',
      range: 'custom',
      start: '2026-09-01',
      end: '2026-09-10',
    });
    expect(parseTrafficSearch({ range: 'custom', start: '2026-09-10', end: '2026-09-01' }).range).toBe('28d');
    expect(parseTrafficSearch({ range: 'custom', start: '01-09-2026', end: '2026-09-10' }).range).toBe('28d');
  });

  it('preset membuang start/end sisa custom', () => {
    expect(toRangeQuery(parseTrafficSearch({ range: '7d', start: '2026-09-01', end: '2026-09-10' }))).toEqual({
      range: '7d',
    });
  });
});

describe('percentChange & deltaTone', () => {
  it('hitung persen, null kalau pembanding 0', () => {
    expect(percentChange(112.5, 100)).toBeCloseTo(12.5);
    expect(percentChange(5, 0)).toBeNull();
  });

  it('naik = membaik, kecuali metrik lowerIsBetter (posisi)', () => {
    expect(deltaTone(12.5)).toBe('up');
    expect(deltaTone(-4.2)).toBe('down');
    expect(deltaTone(-4.2, true)).toBe('up');
    expect(deltaTone(null)).toBe('flat');
    expect(deltaTone(0.01)).toBe('flat');
  });

  it('format panah + persen', () => {
    expect(formatPercentChange(12.5)).toBe('↑ 12,5%');
    expect(formatPercentChange(-4.2)).toBe('↓ 4,2%');
    expect(formatPercentChange(null)).toBe('tidak ada pembanding');
  });
});
