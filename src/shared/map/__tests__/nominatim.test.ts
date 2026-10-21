import { describe, expect, it } from 'vitest';
import { parseNominatimReverse, parseNominatimSearch } from '../nominatim';

describe('parseNominatimSearch', () => {
  it('ambil lat, lon, dan display_name yang valid', () => {
    expect(
      parseNominatimSearch([
        { lat: '1.36', lon: '109.31', display_name: 'Sambas' },
        { lat: 'x', lon: '1', display_name: 'rusak' },
        null,
      ]),
    ).toEqual([{ lat: 1.36, lng: 109.31, label: 'Sambas' }]);
  });

  it('bukan array jadi kosong', () => {
    expect(parseNominatimSearch({ error: 'x' })).toEqual([]);
  });
});

describe('parseNominatimReverse', () => {
  it('ambil display_name', () => {
    expect(parseNominatimReverse({ display_name: 'Istana' })).toBe('Istana');
    expect(parseNominatimReverse({})).toBeNull();
  });
});
