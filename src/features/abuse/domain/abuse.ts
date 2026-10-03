/** Bentuk wire `GET /admin/abuse/*` . */

export type AnonSubjectKind = 'ip' | 'device';

export interface UserAbuseEvent {
  id: string;
  user_id: string;
  username: string | null;
  user_can_contribute: boolean | null;
  user_muted_until: string | null;
  signal: string;
  weight: number;
  entity_type: string | null;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

/** Item `GET /admin/users/:id/abuse-events` (riwayat satu user). */
export type UserAbuseHistoryItem = Pick<
  UserAbuseEvent,
  'id' | 'signal' | 'weight' | 'entity_type' | 'entity_id' | 'meta' | 'created_at'
>;

export interface AnonAbuseEvent {
  id: string;
  subject_kind: AnonSubjectKind;
  subject_key: string;
  signal: string;
  weight: number;
  entity_type: string | null;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface AnonMute {
  subject_kind: AnonSubjectKind;
  subject_key: string;
  muted_until: string;
  updated_at: string | null;
}

export const SIGNAL_LABELS: Record<string, string> = {
  input_rejected: 'Teks ditolak',
  heavy_censor: 'Sensor berat',
  rate_lockout: 'Kena rate limit',
  comment_takedown: 'Komentar diturunkan',
  contribution_spam_reject: 'Kontribusi spam',
  policy_mute: 'Mute otomatis',
  policy_pause: 'Kontribusi dihentikan otomatis',
  policy_deactivate: 'Akun dinonaktifkan otomatis',
  admin_lift: 'Mute dicabut admin',
};

export const SIGNAL_COLORS: Record<string, string> = {
  input_rejected: 'default',
  heavy_censor: 'orange',
  rate_lockout: 'gold',
  comment_takedown: 'volcano',
  contribution_spam_reject: 'volcano',
  policy_mute: 'purple',
  policy_pause: 'magenta',
  policy_deactivate: 'red',
  admin_lift: 'green',
};

export const USER_SIGNALS = [
  'input_rejected',
  'heavy_censor',
  'rate_lockout',
  'comment_takedown',
  'contribution_spam_reject',
  'policy_mute',
  'policy_pause',
  'policy_deactivate',
  'admin_lift',
] as const;

export const ANON_SIGNALS = ['input_rejected', 'rate_lockout', 'policy_mute', 'admin_lift'] as const;

export const SUBJECT_KIND_LABELS: Record<AnonSubjectKind, string> = {
  ip: 'IP',
  device: 'Perangkat',
};

export function isMutedNow(until: string | null | undefined): boolean {
  return !!until && new Date(until).getTime() > Date.now();
}

/** Ringkas meta JSON jadi `k: v, k: v` untuk sel tabel. */
export function summarizeMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return '-';
  const parts = Object.entries(meta).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  return parts.length ? parts.join(', ') : '-';
}
