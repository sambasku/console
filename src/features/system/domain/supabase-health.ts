export type SupabaseHealthEnv = 'staging' | 'production';

export interface SupabaseHealthCheck {
  id: string;
  createdAt: string;
  updatedAt: string;
  projectLabel: string;
  projectRef: string;
  env: SupabaseHealthEnv;
  httpStatus: number | null;
  status: 'ok' | 'failed' | string;
  timeStart: string | null;
  timeEnd: string | null;
  durationMs: number | null;
  githubRunId: string | null;
  githubRunUrl: string | null;
  errorMessage: string | null;
}

export interface SupabaseHealthCheckListResult {
  items: SupabaseHealthCheck[];
  nextCursor: string | null;
  hasMore: boolean;
}
