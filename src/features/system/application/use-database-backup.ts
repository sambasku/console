import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listDatabaseBackupLogsRequest,
  triggerDatabaseBackupRequest,
} from '../infrastructure/database-backup-api';
import { isBackupActive } from '../domain/database-backup';

const listKey = ['admin-database-backup-logs'] as const;

export function useDatabaseBackupLogs(enabled: boolean) {
  return useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => listDatabaseBackupLogsRequest({ limit: 50 }, signal),
    enabled,
    refetchInterval: (q) => {
      const items = q.state.data?.items ?? [];
      return items.some((i) => isBackupActive(i.status)) ? 4_000 : false;
    },
  });
}

export function useTriggerDatabaseBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean) => triggerDatabaseBackupRequest(dryRun),
    // Sukses maupun gagal dispatch, API sudah menulis baris log - refetch agar indikator muncul.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
