import { useMemo } from 'react';
import { theme } from 'antd';
import type { DashboardStats, WordStatusKey } from '../../domain/dashboard-stats';
import { StatusBarsPanel } from './status-bars-panel';

export interface WordsStatusBarsProps {
  words: DashboardStats['words'];
  onNavigate?: () => void;
}

const STATUS_ORDER: WordStatusKey[] = ['pending_review', 'draft', 'published', 'rejected'];

/** Label pendek untuk kolom bar (~88px) - hindari ellipsis "Menunggu Re…". */
const STATUS_LABELS_SHORT: Record<WordStatusKey, string> = {
  pending_review: 'Review',
  draft: 'Draft',
  published: 'Tayang',
  rejected: 'Ditolak',
};

/**
 * Breakdown status kata - bar horizontal (pengganti donut).
 */
export function WordsStatusBars({ words, onNavigate }: WordsStatusBarsProps) {
  const { token } = theme.useToken();
  const byStatus = words.byStatus;
  const total = STATUS_ORDER.reduce((sum, key) => sum + (byStatus[key] ?? 0), 0);
  const pendingReview = byStatus.pending_review ?? 0;

  const colorByStatus: Record<WordStatusKey, string> = useMemo(
    () => ({
      pending_review: token.colorWarning,
      draft: token.colorTextQuaternary,
      published: token.colorSuccess,
      rejected: token.colorError,
    }),
    [token.colorWarning, token.colorTextQuaternary, token.colorSuccess, token.colorError],
  );

  const rows = STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_LABELS_SHORT[key],
    value: byStatus[key] ?? 0,
    color: colorByStatus[key],
  }));

  return (
    <StatusBarsPanel
      title="Status kata"
      subtitle={
        pendingReview > 0
          ? `${pendingReview.toLocaleString('id-ID')} perlu review`
          : `Total ${total.toLocaleString('id-ID')}`
      }
      rows={rows}
      total={total}
      onNavigate={onNavigate}
      ariaLabel={`Status kata: ${pendingReview} perlu review dari ${total} total. Buka daftar kata.`}
    />
  );
}
