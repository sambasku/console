import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/error';
import { sessionStore } from '@/shared/auth/session';
import { loginRequest } from '../infrastructure/auth-api';
import {
  CONSOLE_ACCESS_DENIED_MESSAGE,
  isConsoleAllowedRole,
  type LoginCredentials,
  type AuthSessionResult,
} from '../domain/user';
import { revokeUnauthorizedConsoleSession } from './revoke-unauthorized-console-session';

/**
 * Use case Login - satu-satunya pemilik logika "apa yang terjadi setelah
 * backend mengembalikan token" (simpan ke session store + kosongkan cache
 * data user sebelumnya). Halaman/form cukup consume hook ini.
 *
 * Role non-staff (contributor/editor) ditolak di sini: cookie refresh yang
 * baru dibuat di-revoke agar hard reload tidak bisa restore sesi konsol.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthSessionResult> => {
      const result = await loginRequest(credentials);
      if (!isConsoleAllowedRole(result.user)) {
        await revokeUnauthorizedConsoleSession();
        throw new ApiError(403, 'FORBIDDEN', CONSOLE_ACCESS_DENIED_MESSAGE);
      }
      return result;
    },
    onSuccess: (result: AuthSessionResult) => {
      sessionStore.signIn(result.accessToken, result.expiresIn, result.user);
      // Pengguna baru: data query (list, dsb) dari sesi sebelumnya tidak valid.
      queryClient.clear();
    },
  });
}