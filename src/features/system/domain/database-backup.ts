/** `running` = legacy; alur baru pending -> processing -> succeeded | failed. */
export type DatabaseBackupLogStatus =
  | 'pending'
  | 'processing'
  | 'running'
  | 'succeeded'
  | 'failed'
  | string;

export function isBackupActive(status: DatabaseBackupLogStatus): boolean {
  return status === 'pending' || status === 'processing' || status === 'running';
}

export interface DatabaseBackupLog {
  id: string;
  createdAt: string;
  updatedAt: string;
  triggeredByUserId: string | null;
  triggeredByUsername: string | null;
  triggerSource: string;
  dryRun: boolean;
  status: DatabaseBackupLogStatus;
  timeStart: string | null;
  timeEnd: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  sha256: string | null;
  databaseLabel: string | null;
  assetName: string | null;
  releaseUrl: string | null;
  githubReleaseTag: string | null;
  githubRunId: string | null;
  githubRunUrl: string | null;
  errorMessage: string | null;
}

export interface TriggerBackupResult {
  accepted: true;
  logId: string;
  status: DatabaseBackupLogStatus;
  dryRun: boolean;
}

export interface BackupLogListResult {
  items: DatabaseBackupLog[];
  nextCursor: string | null;
  hasMore: boolean;
}
