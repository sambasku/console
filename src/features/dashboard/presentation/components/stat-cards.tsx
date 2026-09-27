import { theme } from 'antd';
import {
  ROLE_LABELS_SHORT,
  WORD_STATUS_LABELS,
  type DashboardStats,
} from '../../domain/dashboard-stats';

export interface StatCardsProps {
  stats: DashboardStats;
  onNavigateWords?: () => void;
  onNavigateContributions?: () => void;
  onNavigateUsers?: () => void;
  onNavigateAuditLogs?: () => void;
}

function formatMeta(parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' · ');
}

/**
 * Grid KPI 4 card - angka besar, meta terlihat, attention dengan teks legenda.
 */
export function StatCards({
  stats,
  onNavigateWords,
  onNavigateContributions,
  onNavigateUsers,
  onNavigateAuditLogs,
}: StatCardsProps) {
  const { words, contributions, users, activity } = stats;
  const { token } = theme.useToken();
  const pending = contributions.byStatus.pending;
  const hasPending = pending > 0;

  const wordMeta =
    formatMeta([
      words.verified > 0 && `Terverifikasi ${words.verified.toLocaleString('id-ID')}`,
      words.byStatus.published > 0 && `Published ${words.byStatus.published.toLocaleString('id-ID')}`,
      words.byStatus.draft > 0 && `Draft ${words.byStatus.draft.toLocaleString('id-ID')}`,
      words.byStatus.pending_review > 0 &&
        `Review ${words.byStatus.pending_review.toLocaleString('id-ID')}`,
    ]) ||
    Object.entries(words.byStatus)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${WORD_STATUS_LABELS[s as keyof typeof words.byStatus]} ${n}`)
      .join(' · ') ||
    'Belum ada data';

  const contribMeta = hasPending
    ? formatMeta([
        `${pending.toLocaleString('id-ID')} menunggu`,
        contributions.byStatus.approved > 0 &&
          `Disetujui ${contributions.byStatus.approved.toLocaleString('id-ID')}`,
        contributions.byStatus.rejected > 0 &&
          `Ditolak ${contributions.byStatus.rejected.toLocaleString('id-ID')}`,
      ])
    : formatMeta([
        contributions.byStatus.approved > 0 &&
          `Disetujui ${contributions.byStatus.approved.toLocaleString('id-ID')}`,
        contributions.byStatus.rejected > 0 &&
          `Ditolak ${contributions.byStatus.rejected.toLocaleString('id-ID')}`,
        contributions.byStatus.corrected > 0 &&
          `Dikoreksi ${contributions.byStatus.corrected.toLocaleString('id-ID')}`,
      ]) || 'Belum ada data';

  const roleMeta = formatMeta([
    `Aktif 15 mnt ${users.onlineRecently.toLocaleString('id-ID')}`,
    ...(Object.entries(users.byRole) as Array<[keyof typeof users.byRole, number]>)
      .filter(([, n]) => n > 0)
      .map(([role, n]) => `${ROLE_LABELS_SHORT[role]} ${n.toLocaleString('id-ID')}`),
  ]);
  const items: Array<{
    key: string;
    label: string;
    value: number;
    meta: string;
    attention?: boolean;
    onClick?: () => void;
  }> = [
    {
      key: 'words',
      label: 'Kata',
      value: words.total,
      meta: wordMeta,
      onClick: onNavigateWords,
    },
    {
      key: 'contributions',
      label: 'Kontribusi',
      value: contributions.total,
      meta: contribMeta,
      attention: hasPending,
      onClick: onNavigateContributions,
    },
    {
      key: 'users',
      label: 'Pengguna',
      value: users.active,
      meta: roleMeta,
      onClick: onNavigateUsers,
    },
    {
      key: 'activity',
      label: 'Mutasi (7 hari)',
      value: activity.auditLogsLast7Days,
      meta: 'Entri audit log 7 hari terakhir',
      onClick: onNavigateAuditLogs,
    },
  ];

  return (
    <div className="dashboard__kpi" role="list">
      {items.map((item) => {
        const clickable = Boolean(item.onClick);
        const className = [
          'dashboard__kpi-card',
          clickable ? 'dashboard__kpi-card--clickable' : '',
          item.attention ? 'dashboard__kpi-card--attention' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const style = item.attention
          ? { ['--kpi-accent' as string]: token.colorWarning }
          : undefined;
        const body = (
          <>
            <span className="dashboard__kpi-label">{item.label}</span>
            <span className="dashboard__kpi-value">{item.value.toLocaleString('id-ID')}</span>
            <span className="dashboard__kpi-meta">{item.meta}</span>
          </>
        );

        return (
          <div key={item.key} role="listitem" className="dashboard__kpi-cell">
            {clickable ? (
              <button type="button" className={className} style={style} onClick={item.onClick}>
                {body}
              </button>
            ) : (
              <div className={className} style={style}>
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
