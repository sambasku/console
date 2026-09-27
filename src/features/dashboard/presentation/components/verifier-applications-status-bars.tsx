import { theme } from 'antd';
import type { VerifierApplicationsStats } from '../../domain/dashboard-stats';
import { StatusBarsPanel } from './status-bars-panel';

export interface VerifierApplicationsStatusBarsProps {
  stats: VerifierApplicationsStats;
  onNavigate?: () => void;
}

/**
 * Breakdown pengajuan verifikator - bar horizontal (pengganti donut).
 */
export function VerifierApplicationsStatusBars({
  stats,
  onNavigate,
}: VerifierApplicationsStatusBarsProps) {
  const { token } = theme.useToken();
  const total = stats.pending + stats.approved + stats.rejected;

  return (
    <StatusBarsPanel
      title="Pengajuan verifikator"
      subtitle={
        stats.pending > 0
          ? `${stats.pending.toLocaleString('id-ID')} menunggu`
          : `Total ${total.toLocaleString('id-ID')}`
      }
      rows={[
        { key: 'pending', label: 'Menunggu', value: stats.pending, color: token.colorWarning },
        { key: 'approved', label: 'Disetujui', value: stats.approved, color: token.colorSuccess },
        { key: 'rejected', label: 'Ditolak', value: stats.rejected, color: token.colorError },
      ]}
      total={total}
      onNavigate={onNavigate}
      ariaLabel={`Pengajuan verifikator: ${stats.pending} menunggu, ${stats.approved} disetujui, ${stats.rejected} ditolak.`}
    />
  );
}
