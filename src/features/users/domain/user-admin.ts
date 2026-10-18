export type AdminUserRole = 'contributor' | 'editor' | 'reviewer' | 'admin' | 'root';

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  /** Provider OAuth tertaut; kosong = onboard email/password. */
  authProviders: string[];
  isActive: boolean;
  canContribute: boolean;
  /** Mute sementara dari policy abuse (ISO); null = tidak dibatasi. */
  contributeMutedUntil: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export const ROLE_LABELS: Record<AdminUserRole, string> = {
  root: 'Root',
  admin: 'Admin',
  reviewer: 'Verifikator',
  editor: 'Editor',
  contributor: 'Kontributor',
};

export const ROLE_TAG_COLOR: Record<AdminUserRole, string> = {
  root: 'magenta',
  admin: 'geekblue',
  reviewer: 'cyan',
  editor: 'gold',
  contributor: 'default',
};
/** Label + warna metode onboard (auth_identities.provider). */
export const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  github: 'GitHub',
};
export const PROVIDER_TAG_COLOR: Record<string, string> = {
  google: 'blue',
  facebook: 'geekblue',
  github: 'purple',
};

export const CHANGEABLE_ROLES: Exclude<AdminUserRole, 'root'>[] = [
  'contributor',
  'editor',
  'reviewer',
  'admin',
];

export const ROLE_OPTIONS_SELECT: { value: Exclude<AdminUserRole, 'root'>; label: string }[] =
  CHANGEABLE_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));
