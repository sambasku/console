import type { DashboardStats } from '../../domain/dashboard-stats';

export interface AttentionQueueProps {
  stats: DashboardStats;
  onNavigateContributions: () => void;
  onNavigateWords: () => void;
  onNavigateProblems: () => void;
  onNavigateVerifierApplications: () => void;
}

interface AttentionItem {
  key: string;
  label: string;
  count: number;
  onClick: () => void;
}

/**
 * Strip antrean yang perlu tindakan - hanya item count > 0.
 */
export function AttentionQueue({
  stats,
  onNavigateContributions,
  onNavigateWords,
  onNavigateProblems,
  onNavigateVerifierApplications,
}: AttentionQueueProps) {
  const items: AttentionItem[] = [
    {
      key: 'contributions',
      label: 'Kontribusi',
      count: stats.contributions.byStatus.pending,
      onClick: onNavigateContributions,
    },
    {
      key: 'word-review',
      label: 'Review kata',
      count: stats.words.byStatus.pending_review,
      onClick: onNavigateWords,
    },
    {
      key: 'problems',
      label: 'Laporan terbuka',
      count: stats.problems.open,
      onClick: onNavigateProblems,
    },
    {
      key: 'verifier',
      label: 'Pengajuan verifikator',
      count: stats.verifierApplications.pending,
      onClick: onNavigateVerifierApplications,
    },
  ].filter((item) => item.count > 0);

  if (items.length === 0) {
    return (
      <div className="dashboard__attention dashboard__attention--empty" role="status">
        <span className="dashboard__attention-title">Perlu Tindakan</span>
        <span className="dashboard__attention-empty">Tidak ada antrean menunggu.</span>
      </div>
    );
  }

  return (
    <div className="dashboard__attention" aria-label="Perlu Tindakan">
      <span className="dashboard__attention-title">Perlu Tindakan</span>
      <ul className="dashboard__attention-list">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className="dashboard__attention-chip"
              onClick={item.onClick}
              aria-label={`${item.label}: ${item.count.toLocaleString('id-ID')}. Buka antrean.`}
            >
              <span className="dashboard__attention-chip-label">{item.label}</span>
              <span className="dashboard__attention-chip-count">
                {item.count.toLocaleString('id-ID')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
