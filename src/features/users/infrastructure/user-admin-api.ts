import { client } from '@/shared/api/client';
import type { ApiCursorPageEnvelope, CursorPage } from '@/shared/api/types';
import type { AdminUserRole } from '../domain/user-admin';

export interface AdminUserWire {
  id: string;
  username: string;
  email: string;
  /** Nomor HP ternormalisasi 62… (null = belum diisi). */
  phone?: string | null;
  role: string;
  avatar_url?: string | null;
  /** Provider OAuth tertaut (google/fb/github); kosong = onboard email/password. */
  auth_providers?: string[];
  is_active: boolean;
  can_contribute: boolean;
  contribute_muted_until: string | null;
  email_verified?: boolean;
  email_verified_at?: string | null;
  /** OTP verifikasi terakhir; null = tidak ada OTP tertunda. */
  otp?: { created_at: string; expires_at: string } | null;
  created_at: string;
  updated_at: string | null;
}

export interface ListAdminUsersParams {
  q?: string;
  role?: AdminUserRole;
  canContribute?: boolean;
  limit?: number;
  cursor?: string;
}

export async function listAdminUsersRequest(
  params: ListAdminUsersParams,
  signal?: AbortSignal,
): Promise<CursorPage<AdminUserWire>> {
  const res = await client.get<ApiCursorPageEnvelope<AdminUserWire>>('/admin/users', {
    params: {
      q: params.q || undefined,
      role: params.role || undefined,
      can_contribute: params.canContribute === undefined ? undefined : String(params.canContribute),
      limit: params.limit ?? 20,
      cursor: params.cursor,
    },
    signal,
  });
  return { data: res.data.data, meta: res.data.meta };
}

export async function updateUserRoleRequest(
  id: string,
  role: Exclude<AdminUserRole, 'root'>,
  signal?: AbortSignal,
): Promise<{ id: string; role: AdminUserRole }> {
  const res = await client.patch<{
    success: true;
    data: { id: string; role: AdminUserRole };
  }>(`/admin/users/${id}/role`, { role }, { signal });
  return res.data.data;
}

export async function setCanContributeRequest(id: string, canContribute: boolean): Promise<void> {
  await client.patch(`/admin/contribution-access/${id}`, { can_contribute: canContribute });
}

/** Verifikasi email manual oleh admin (mis. OTP gagal terkirim ke user). */
export async function verifyUserEmailRequest(
  id: string,
): Promise<{ id: string; email_verified: true; email_verified_at: string }> {
  const res = await client.post<{
    success: true;
    data: { id: string; email_verified: true; email_verified_at: string };
  }>(`/admin/users/${id}/verify-email`);
  return res.data.data;
}

export interface CreateAdminUserInput {
  username: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
  role: Exclude<AdminUserRole, 'root'>;
  is_active: boolean;
}

export async function createAdminUserRequest(input: CreateAdminUserInput): Promise<AdminUserWire> {
  const res = await client.post<{ success: true; data: AdminUserWire }>('/admin/users', input);
  return res.data.data;
}

export async function setUserActiveRequest(id: string, isActive: boolean): Promise<void> {
  await client.patch(`/admin/users/${id}/active`, { is_active: isActive });
}
