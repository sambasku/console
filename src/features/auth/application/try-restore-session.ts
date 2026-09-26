import { performRefresh } from '@/shared/api/client';
import { isAuthExpiredError } from '@/shared/api/error';
import { sessionStore } from '@/shared/auth/session';
import { isConsoleAllowedRole } from '../domain/user';
import { revokeUnauthorizedConsoleSession } from './revoke-unauthorized-console-session';

let restorePromise: Promise<boolean> | null = null;

async function ensureConsoleRoleAllowed(): Promise<boolean> {
  const role = sessionStore.getSnapshot().user?.role;
  if (isConsoleAllowedRole(role)) return true;
  await revokeUnauthorizedConsoleSession();
  return false;
}

/**
 * Session restore saat boot / hard reload.
 *
 * Access token di memory hilang ketika halaman di-refresh (docs/auth: token
 * TIDAK di-persist). Proses: panggil POST /auth/refresh (httpOnly cookie
 * otomatis terkirim) → token baru → build user dari klaim JWT + cache
 * sessionStorage → signIn ulang. Kalau cookie tidak ada/invalid (401) → sesi
 * dianggap logout (diam, tanpa error banner).
 *
 * Setelah restore sukses, role dicek: contributor/editor ditolak (konsol
 * hanya admin/root/verifikator) - cookie di-revoke agar tidak loop.
 *
 * Kegagalan jaringan / timeout / 5xx TIDAK memanggil `sessionStore.clear()`:
 * cache username di sessionStorage masih diperlukan setelah circuit breaker
 * pindah tier dan refresh dicoba lagi.
 *
 * Idempotent + single-flight: dipanggil dari `beforeLoad` root route pada
 * setiap navigasi, biayanya nol kalau sesi sudah aktif.
 */
export function tryRestoreSession(): Promise<boolean> {
  if (sessionStore.isAuthenticated()) {
    return ensureConsoleRoleAllowed();
  }

  if (!restorePromise) {
    restorePromise = performRefresh()
      .then(() => ensureConsoleRoleAllowed())
      .catch((err: unknown) => {
        if (isAuthExpiredError(err)) {
          sessionStore.clear();
        }
        return false;
      })
      .finally(() => {
        restorePromise = null;
      });
  }
  return restorePromise;
}
