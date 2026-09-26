import { describe, expect, it } from 'vitest';
import {
  ensureDailyActivityLast30Days,
  normalizeDashboardStats,
} from '../../application/dashboard-mappers';
import type { DashboardStatsWire } from '../../infrastructure/dashboard-api';

function wireFixture(overrides?: Partial<DashboardStatsWire>): DashboardStatsWire {
  return {
    words: {
      total: 1,
      verified: 0,
      deleted: 0,
      by_status: { draft: 0, pending_review: 0, published: 1, rejected: 0 },
    },
    contributions: {
      total: 2,
      by_status: { pending: 1, approved: 1, rejected: 0, corrected: 0 },
    },
    users: {
      active: 1,
      by_role: { root: 0, admin: 1, editor: 0, reviewer: 0, contributor: 0 },
    },
    activity: {
      audit_logs_last_7_days: 5,
      daily_last_30_days: [
        {
          date: '2026-09-20',
          contributions: 1,
          votes: 0,
          comments: 2,
          new_users: 1,
        },
        {
          date: '2026-09-27',
          contributions: 2,
          votes: 5,
          comments: 0,
          new_users: 0,
        },
      ],
    },
    problems: {
      open: 3,
      closed: 5,
      by_source: {
        bug_reports: { open: 1, closed: 3 },
        word_reports: { open: 2, closed: 2 },
      },
    },
    ...overrides,
  };
}

describe('normalizeDashboardStats', () => {
  it('memetakan wire + pad tetap 30 hari WIB (4 series)', () => {
    const now = new Date('2026-09-26T20:00:00.000Z'); // = 2026-09-27 WIB
    const stats = normalizeDashboardStats(wireFixture(), now);
    expect(stats.contributions.total).toBe(2);
    expect(stats.activity.auditLogsLast7Days).toBe(5);
    expect(stats.activity.dailyLast30Days).toHaveLength(30);
    expect(stats.activity.dailyLast30Days[0]?.date).toBe('2026-08-29');
    expect(stats.activity.dailyLast30Days[29]?.date).toBe('2026-09-27');
    expect(stats.activity.dailyLast30Days[29]).toMatchObject({
      contributions: 2,
      votes: 5,
      comments: 0,
      newUsers: 0,
    });
    expect(stats.activity.dailyLast30Days.find((p) => p.date === '2026-09-20')).toMatchObject({
      contributions: 1,
      votes: 0,
      comments: 2,
      newUsers: 1,
    });
    expect(stats.problems).toEqual({
      open: 3,
      closed: 5,
      bySource: {
        bugReports: { open: 1, closed: 3 },
        wordReports: { open: 2, closed: 2 },
      },
    });
  });

  it('problems hilang → open/closed 0', () => {
    const wire = wireFixture();
    delete wire.problems;
    const stats = normalizeDashboardStats(wire);
    expect(stats.problems.open).toBe(0);
    expect(stats.problems.closed).toBe(0);
  });

  it('daily_last_30_days hilang → tetap 30 titik angka 0', () => {
    const wire = wireFixture({
      activity: { audit_logs_last_7_days: 5 },
    });
    const now = new Date('2026-09-26T20:00:00.000Z');
    const stats = normalizeDashboardStats(wire, now);
    expect(stats.activity.dailyLast30Days).toHaveLength(30);
    expect(
      stats.activity.dailyLast30Days.every(
        (p) => p.contributions === 0 && p.votes === 0 && p.comments === 0 && p.newUsers === 0,
      ),
    ).toBe(true);
  });
});

describe('ensureDailyActivityLast30Days', () => {
  it('panjang selalu 30, merge 4 series, gap = 0', () => {
    const now = new Date('2026-09-26T20:00:00.000Z');
    const points = ensureDailyActivityLast30Days(
      [{ date: '2026-09-20', contributions: 4, votes: 1, comments: 0, new_users: 2 }],
      now,
    );
    expect(points).toHaveLength(30);
    expect(points[0]?.date).toBe('2026-08-29');
    expect(points[29]?.date).toBe('2026-09-27');
    expect(points.find((p) => p.date === '2026-09-20')).toMatchObject({
      contributions: 4,
      votes: 1,
      comments: 0,
      newUsers: 2,
    });
    expect(points.find((p) => p.date === '2026-09-21')).toMatchObject({
      contributions: 0,
      votes: 0,
      comments: 0,
      newUsers: 0,
    });
  });
});
