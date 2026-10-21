/** Jenis reward dalam satu katalog achievement. */
export type RewardType = 'profile_border' | 'badge' | 'sticker';

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  profile_border: 'Border',
  badge: 'Badge',
  sticker: 'Stiker',
};

export type AchievementCategory =
  | 'kohort'
  | 'kontribusi'
  | 'komunitas'
  | 'kualitas'
  | 'momen';

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  kohort: 'Kohort',
  kontribusi: 'Kontribusi',
  komunitas: 'Komunitas',
  kualitas: 'Kualitas',
  momen: 'Momen',
};

/** Grammar kriteria - registry source di backend (achievement-registry.ts). */
export interface AchievementCriteria {
  source: string;
  threshold?: number | null;
  window?: { from: string; to: string } | null;
  filters?: Record<string, string> | null;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rewardType: RewardType;
  badgeUrl: string | null;
  criteria: AchievementCriteria;
  family: string | null;
  level: number | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number | null;
  /** Jumlah penerima (hanya list admin). */
  recipientCount?: number;
}

export interface AchievementInput {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  reward_type: RewardType;
  badge_url: string | null;
  criteria: AchievementCriteria;
  family?: string | null;
  level?: number | null;
  is_active?: boolean;
}

export interface GrantResult {
  awarded: number;
  skipped: number;
  missing: string[];
}

export interface ScanResult {
  scanned: number;
  awarded: number;
}

export interface PreviewResult {
  total: number;
  sample: Array<{ username: string; display_name: string; matched_at: string }>;
}

/** Satu penerima achievement; `awardId` dipakai saat revoke. */
export interface AchievementRecipient {
  awardId: string;
  username: string;
  displayName: string;
  awardedAt: number;
  grantedVia: string;
}
