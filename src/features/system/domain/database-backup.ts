export type DatabaseBackupLogStatus = 'running' | 'succeeded' | 'failed' | string;

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
  workflow: string;
  ref: string;
  dryRun: boolean;
  htmlUrl: string;
}

export interface BackupLogListResult {
  items: DatabaseBackupLog[];
  nextCursor: string | null;
  hasMore: boolean;
}
