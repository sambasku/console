import type { ActivityDailyPoint, DashboardStats } from '../domain/dashboard-stats';
import type { DashboardStatsWire } from '../infrastructure/dashboard-api';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAILY_WINDOW_DAYS = 30;

function wibDateString(now: Date = new Date()): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

function shiftCalendarDate(ymd: string, deltaDays: number): string {
  const utc = new Date(`${ymd}T00:00:00.000Z`);
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  return utc.toISOString().slice(0, 10);
}

/**
 * Selalu 30 titik WIB (today-29 … today). Panjang tetap untuk layout chart.
 * Payload lama / pendek di-pad di client; hari tanpa data = 0.
 */
export function ensureDailyActivityLast30Days(
  raw:
    | Array<{
        date: string;
        contributions: number;
        votes: number;
        comments: number;
        new_users: number;
        searches?: number;
      }>
    | undefined
    | null,
  now: Date = new Date(),
): ActivityDailyPoint[] {
  const todayWib = wibDateString(now);
  const byDay = new Map(
    (raw ?? []).map((p) => [
      p.date,
      {
        contributions: p.contributions,
        votes: p.votes,
        comments: p.comments,
        newUsers: p.new_users,
        searches: p.searches ?? 0,
      },
    ]),
  );
  const points: ActivityDailyPoint[] = [];
  for (let i = DAILY_WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const date = shiftCalendarDate(todayWib, -i);
    const hit = byDay.get(date);
    points.push({
      date,
      contributions: hit?.contributions ?? 0,
      votes: hit?.votes ?? 0,
      comments: hit?.comments ?? 0,
      newUsers: hit?.newUsers ?? 0,
      searches: hit?.searches ?? 0,
    });
  }
  return points;
}

export function normalizeDashboardStats(
  wire: DashboardStatsWire,
  now: Date = new Date(),
): DashboardStats {
  return {
    words: {
      total: wire.words.total,
      verified: wire.words.verified,
      deleted: wire.words.deleted,
      byStatus: wire.words.by_status as DashboardStats['words']['byStatus'],
    },
    contributions: {
      total: wire.contributions.total,
      byStatus: wire.contributions.by_status as DashboardStats['contributions']['byStatus'],
    },
    users: {
      active: wire.users.active,
      onlineRecently: wire.users.online_recently ?? 0,
      byRole: wire.users.by_role as DashboardStats['users']['byRole'],
    },
    activity: {
      auditLogsLast7Days: wire.activity.audit_logs_last_7_days,
      dailyLast30Days: ensureDailyActivityLast30Days(wire.activity.daily_last_30_days, now),
    },
    problems: {
      open: wire.problems?.open ?? 0,
      closed: wire.problems?.closed ?? 0,
      bySource: {
        bugReports: {
          open: wire.problems?.by_source.bug_reports.open ?? 0,
          closed: wire.problems?.by_source.bug_reports.closed ?? 0,
        },
        wordReports: {
          open: wire.problems?.by_source.word_reports.open ?? 0,
          closed: wire.problems?.by_source.word_reports.closed ?? 0,
        },
      },
    },
    verifierApplications: {
      pending: wire.verifier_applications?.pending ?? 0,
      approved: wire.verifier_applications?.approved ?? 0,
      rejected: wire.verifier_applications?.rejected ?? 0,
    },
  };
}
