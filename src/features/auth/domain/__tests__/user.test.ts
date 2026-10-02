import { describe, expect, it } from 'vitest';
import { isConsoleAllowedRole, type User } from '../user';

const userWith = (...roles: string[]): User => ({
  id: '01HXYZABC',
  username: 'u',
  roles,
  role: roles[0] ?? 'contributor',
});

describe('isConsoleAllowedRole', () => {
  it('mengizinkan admin, root, reviewer (multi role: cukup satu)', () => {
    expect(isConsoleAllowedRole(userWith('admin'))).toBe(true);
    expect(isConsoleAllowedRole(userWith('root'))).toBe(true);
    expect(isConsoleAllowedRole(userWith('reviewer'))).toBe(true);
    expect(isConsoleAllowedRole(userWith('contributor', 'reviewer'))).toBe(true);
    expect(isConsoleAllowedRole(userWith('editor', 'admin'))).toBe(true);
  });

  it('menolak contributor, editor, tanpa role, kosong', () => {
    expect(isConsoleAllowedRole(userWith('contributor'))).toBe(false);
    expect(isConsoleAllowedRole(userWith('editor'))).toBe(false);
    expect(isConsoleAllowedRole(userWith())).toBe(false);
    expect(isConsoleAllowedRole(undefined)).toBe(false);
    expect(isConsoleAllowedRole(null)).toBe(false);
  });
});
