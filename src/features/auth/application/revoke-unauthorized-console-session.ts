import { sessionStore } from '@/shared/auth/session';
import { logoutRequest } from '../infrastructure/auth-api';

/**
 * Sesi valid di API tapi role tidak boleh ke konsol → revoke cookie (best-effort)
 * lalu bersihkan memori. Dipakai login, restore, dan guard router.
 */
export async function revokeUnauthorizedConsoleSession(): Promise<void> {
  try {
    await logoutRequest();
  } catch {
    // Cookie mungkin sudah mati / jaringan gagal - sesi lokal tetap harus kosong.
  } finally {
    sessionStore.clear();
  }
}
