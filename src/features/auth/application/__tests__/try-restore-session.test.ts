import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/error';
import { restoreSessionUser, sessionStore } from '@/shared/auth/session';

vi.mock('@/shared/api/client', () => ({
  performRefresh: vi.fn(),
}));

vi.mock('../../infrastructure/auth-api', () => ({
  logoutRequest: vi.fn().mockResolvedValue(undefined),
}));

import { performRefresh } from '@/shared/api/client';
import { logoutRequest } from '../../infrastructure/auth-api';
import { tryRestoreSession } from '../try-restore-session';

const USER_CACHE_KEY = 'sambasku_admin_user_v1';
const cachedUser = {
  id: '01HXYZABC',
  username: 'siti',
  role: 'admin',
  display_name: null as string | null,
};
const contributorUser = {
  id: '01HXYZCON',
  username: 'budi',
  role: 'contributor',
  display_name: null as string | null,
};

describe('tryRestoreSession', () => {
  beforeEach(() => {
    sessionStore.clear();
    sessionStorage.clear();
    vi.mocked(performRefresh).mockReset();
    vi.mocked(logoutRequest).mockReset().mockResolvedValue(undefined);
  });

  it('sukses → true tanpa mengubah cache yang sudah ada', async () => {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachedUser));
    vi.mocked(performRefresh).mockResolvedValue('new-access');
    // performRefresh di mock tidak memanggil signIn - simulasikan efek sukses
    // dengan menandai sesi setelah mock (pola produksi: refresh → signIn).
    vi.mocked(performRefresh).mockImplementation(async () => {
      sessionStore.signIn('new-access', 900, cachedUser);
      return 'new-access';
    });

    await expect(tryRestoreSession()).resolves.toBe(true);
    expect(restoreSessionUser()).toEqual(cachedUser);
    expect(logoutRequest).not.toHaveBeenCalled();
  });

  it('401 → clear sesi (termasuk cache identitas) dan false', async () => {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachedUser));
    vi.mocked(performRefresh).mockRejectedValue(
      new ApiError(401, 'UNAUTHORIZED', 'Refresh token tidak valid'),
    );

    await expect(tryRestoreSession()).resolves.toBe(false);
    expect(restoreSessionUser()).toBeNull();
    expect(sessionStore.isAuthenticated()).toBe(false);
  });

  it('network error → false tanpa menghapus cache identitas', async () => {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachedUser));
    vi.mocked(performRefresh).mockRejectedValue(
      new ApiError(0, 'NETWORK_ERROR', 'Sesi tidak dapat diperbarui, coba lagi'),
    );

    await expect(tryRestoreSession()).resolves.toBe(false);
    expect(restoreSessionUser()).toEqual(cachedUser);
  });

  it('sudah autentikasi staff → true tanpa memanggil refresh', async () => {
    sessionStore.signIn('access', 900, cachedUser);
    await expect(tryRestoreSession()).resolves.toBe(true);
    expect(performRefresh).not.toHaveBeenCalled();
  });

  it('sudah autentikasi contributor → revoke + false', async () => {
    sessionStore.signIn('access', 900, contributorUser);
    await expect(tryRestoreSession()).resolves.toBe(false);
    expect(logoutRequest).toHaveBeenCalledOnce();
    expect(sessionStore.isAuthenticated()).toBe(false);
    expect(performRefresh).not.toHaveBeenCalled();
  });

  it('refresh sukses tapi role editor → revoke + false', async () => {
    const editor = { id: '01HXYZEDT', username: 'edi', role: 'editor', display_name: null as string | null };
    vi.mocked(performRefresh).mockImplementation(async () => {
      sessionStore.signIn('new-access', 900, editor);
      return 'new-access';
    });

    await expect(tryRestoreSession()).resolves.toBe(false);
    expect(logoutRequest).toHaveBeenCalledOnce();
    expect(sessionStore.isAuthenticated()).toBe(false);
  });
});
