import { theme } from 'antd';
import type { ProblemsStats } from '../../domain/dashboard-stats';
import { StatusBarsPanel } from './status-bars-panel';

export interface ProblemsStatusBarsProps {
  problems: ProblemsStats;
  onNavigate?: () => void;
}

/**
 * Breakdown permasalahan - bar horizontal (pengganti donut).
 */
export function ProblemsStatusBars({ problems, onNavigate }: ProblemsStatusBarsProps) {
  const { token } = theme.useToken();
  const total = problems.open + problems.closed;
  const bugTotal = problems.bySource.bugReports.open + problems.bySource.bugReports.closed;
  const wordTotal = problems.bySource.wordReports.open + problems.bySource.wordReports.closed;

  return (
    <StatusBarsPanel
      title="Permasalahan"
      subtitle={`Bug ${bugTotal.toLocaleString('id-ID')} · Kata ${wordTotal.toLocaleString('id-ID')}`}
      rows={[
        {
          key: 'open',
          label: 'Perlu tindakan',
          value: problems.open,
          color: token.colorWarning,
        },
        { key: 'closed', label: 'Selesai', value: problems.closed, color: token.colorSuccess },
      ]}
      total={total}
      onNavigate={onNavigate}
      ariaLabel={`Permasalahan: ${problems.open} perlu tindakan, ${problems.closed} selesai. Buka laporan bug.`}
    />
  );
}
