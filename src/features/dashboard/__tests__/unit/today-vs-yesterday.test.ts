import { describe, expect, it } from 'vitest';
import type { ActivityDailyPoint } from '../../domain/dashboard-stats';
import { buildTodayVsYesterday, formatDelta } from '../../application/today-vs-yesterday';

function point(overrides: Partial<ActivityDailyPoint> & { date: string }): ActivityDailyPoint {
  return {
    contributions: 0,
    votes: 0,
    comments: 0,
    newUsers: 0,
    ...overrides,
  };
}

describe('buildTodayVsYesterday', () => {
  it('menghitung delta vs hari sebelumnya', () => {
    const metrics = buildTodayVsYesterday([
      point({ date: '2026-09-25', contributions: 2, votes: 10, comments: 1, newUsers: 0 }),
      point({ date: '2026-09-26', contributions: 5, votes: 8, comments: 1, newUsers: 2 }),
    ]);
    expect(metrics.find((m) => m.key === 'contributions')).toMatchObject({
      today: 5,
      yesterday: 2,
      delta: 3,
    });
    expect(metrics.find((m) => m.key === 'votes')).toMatchObject({
      today: 8,
      yesterday: 10,
      delta: -2,
    });
    expect(metrics.find((m) => m.key === 'comments')).toMatchObject({ delta: 0 });
    expect(metrics.find((m) => m.key === 'newUsers')).toMatchObject({ delta: 2 });
  });

  it('sembunyikan delta jika hanya satu titik', () => {
    const metrics = buildTodayVsYesterday([
      point({ date: '2026-09-26', contributions: 3 }),
    ]);
    expect(metrics.every((m) => m.delta === null && m.yesterday === null)).toBe(true);
    expect(metrics[0].today).toBe(3);
  });
});

describe('formatDelta', () => {
  it('memformat tanda + / -', () => {
    expect(formatDelta(3)).toBe('+3');
    expect(formatDelta(-2)).toBe('-2');
    expect(formatDelta(0)).toBe('0');
  });
});
