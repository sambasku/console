import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  SupabaseHealthCheck,
  SupabaseHealthCheckListResult,
} from '../domain/supabase-health';

export interface SupabasePingResult {
  status: 'ok' | 'failed';
  http_status: number | null;
  duration_ms: number;
  error_message: string | null;
}
type WireHealthCheck = {
  id: string;
  created_at: string;
  updated_at: string;
  project_label: string;
  project_ref: string;
  env: SupabaseHealthCheck['env'];
  http_status: number | null;
  status: string;
  time_start: string | null;
  time_end: string | null;
  duration_ms: number | null;
  github_run_id: string | null;
  github_run_url: string | null;
  error_message: string | null;
};

function mapHealthCheck(w: WireHealthCheck): SupabaseHealthCheck {
  return {
    id: w.id,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    projectLabel: w.project_label,
    projectRef: w.project_ref,
    env: w.env,
    httpStatus: w.http_status,
    status: w.status,
    timeStart: w.time_start,
    timeEnd: w.time_end,
    durationMs: w.duration_ms,
    githubRunId: w.github_run_id,
    githubRunUrl: w.github_run_url,
    errorMessage: w.error_message,
  };
}

export async function listSupabaseHealthChecksRequest(
  opts: { limit?: number; cursor?: string; env?: string } = {},
  signal?: AbortSignal,
): Promise<SupabaseHealthCheckListResult> {
  const res = await client.get<
    ApiOkEnvelope<WireHealthCheck[]> & {
      meta: { limit: number; next_cursor: string | null; has_more: boolean };
    }
  >('/admin/system/supabase/health-checks', {
    params: { limit: opts.limit ?? 20, cursor: opts.cursor, env: opts.env },
    signal,
  });
  return {
    items: (res.data.data ?? []).map(mapHealthCheck),
    nextCursor: res.data.meta.next_cursor,
    hasMore: res.data.meta.has_more,
  };
}

export async function triggerSupabasePingRequest(
  signal?: AbortSignal,
): Promise<SupabasePingResult> {
  const res = await client.post<ApiOkEnvelope<SupabasePingResult>>(
    '/admin/system/supabase/ping',
    null,
    { signal },
  );
  return res.data.data;
}
