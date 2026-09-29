import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  BackupLogListResult,
  DatabaseBackupLog,
  TriggerBackupResult,
} from '../domain/database-backup';

type WireLog = {
  id: string;
  created_at: string;
  updated_at: string;
  triggered_by_user_id: string | null;
  triggered_by_username: string | null;
  trigger_source: string;
  dry_run: boolean;
  status: string;
  time_start: string | null;
  time_end: string | null;
  duration_ms: number | null;
  size_bytes: number | null;
  sha256: string | null;
  database_label: string | null;
  asset_name: string | null;
  release_url: string | null;
  github_release_tag: string | null;
  github_run_id: string | null;
  github_run_url: string | null;
  error_message: string | null;
};

function mapLog(w: WireLog): DatabaseBackupLog {
  return {
    id: w.id,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    triggeredByUserId: w.triggered_by_user_id,
    triggeredByUsername: w.triggered_by_username,
    triggerSource: w.trigger_source,
    dryRun: w.dry_run,
    status: w.status,
    timeStart: w.time_start,
    timeEnd: w.time_end,
    durationMs: w.duration_ms,
    sizeBytes: w.size_bytes,
    sha256: w.sha256,
    databaseLabel: w.database_label,
    assetName: w.asset_name,
    releaseUrl: w.release_url,
    githubReleaseTag: w.github_release_tag,
    githubRunId: w.github_run_id,
    githubRunUrl: w.github_run_url,
    errorMessage: w.error_message,
  };
}

export async function triggerDatabaseBackupRequest(
  dryRun: boolean,
  signal?: AbortSignal,
): Promise<TriggerBackupResult> {
  const res = await client.post<
    ApiOkEnvelope<{
      accepted: true;
      log_id: string;
      status: string;
      dry_run: boolean;
    }>
  >('/admin/system/database/backup', { dry_run: dryRun }, { signal });
  const d = res.data.data;
  return {
    accepted: true,
    logId: d.log_id,
    status: d.status,
    dryRun: d.dry_run,
  };
}

export async function listDatabaseBackupLogsRequest(
  opts: { limit?: number; cursor?: string } = {},
  signal?: AbortSignal,
): Promise<BackupLogListResult> {
  const res = await client.get<
    ApiOkEnvelope<WireLog[]> & {
      meta: { limit: number; next_cursor: string | null; has_more: boolean };
    }
  >('/admin/system/database/backups', {
    params: { limit: opts.limit ?? 20, cursor: opts.cursor },
    signal,
  });
  return {
    items: (res.data.data ?? []).map(mapLog),
    nextCursor: res.data.meta.next_cursor,
    hasMore: res.data.meta.has_more,
  };
}
