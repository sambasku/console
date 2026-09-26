import type { SessionUser } from '@/shared/auth/session';

/** Role user pada sistem (docs/api/auth, role matrix Section 22 API doc). */
export const ROLES = ['root', 'admin', 'reviewer', 'editor', 'contributor'] as const;
export type UserRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  root: 'Root',
  admin: 'Admin',
  reviewer: 'Verifikator',
  editor: 'Editor',
  contributor: 'Kontributor',
};

/**
 * Role yang boleh masuk konsol admin. Login API tetap menerima semua role
 * (dipakai mobile/web); pembatasan ini khusus klien console.
 */
export const CONSOLE_ALLOWED_ROLES = ['root', 'admin', 'reviewer'] as const;
export type ConsoleAllowedRole = (typeof CONSOLE_ALLOWED_ROLES)[number];

export function isConsoleAllowedRole(role: string | null | undefined): role is ConsoleAllowedRole {
  return !!role && (CONSOLE_ALLOWED_ROLES as readonly string[]).includes(role);
}

export const CONSOLE_ACCESS_DENIED_MESSAGE =
  'Akun ini tidak memiliki akses ke konsol. Hanya admin, root, atau verifikator yang boleh masuk.';

export type User = SessionUser;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSessionResult {
  accessToken: string;
  expiresIn: number;
  user: User;
}