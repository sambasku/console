/** Pengumuman admin (#102) - tayang di feed publik aplikasi. */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdBy: string;
  /** Epoch detik. Null = tanpa masa berlaku. */
  expiresAt: number | null;
  /** Epoch detik. */
  createdAt: number;
  updatedAt: number | null;
}

/** Host action_url yang diizinkan API (whitelist sinkron announcement.validator.ts). */
export const ACTION_URL_ALLOWED_HOSTS = [
  'sambasku.com',
  'www.sambasku.com',
  'sambasku-staging.iamutaki.com',
  'sambasku.iamutaki.com',
  'play.google.com',
] as const;
