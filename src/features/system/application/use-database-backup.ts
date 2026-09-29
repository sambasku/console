import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listDatabaseBackupLogsRequest,
  triggerDatabaseBackupRequest,
} from '../infrastructure/database-backup-api';

const listKey = ['admin-database-backup-logs'] as const;

export function useDatabaseBackupLogs(enabled: boolean) {
  return useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => listDatabaseBackupLogsRequest({ limit: 50 }, signal),
    enabled,
    refetchInterval: (q) => {
      const items = q.state.data?.items ?? [];
      const pending = items.some((i) => i.status === 'running');
      return pending ? 15_000 : false;
    },
  });
}

export function useTriggerDatabaseBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean) => triggerDatabaseBackupRequest(dryRun),
    onSuccess: () => {
      // Log muncul setelah CI selesai - refetch ringan agar tabel tidak stale lama
      void qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
