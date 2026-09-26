import { describe, expect, it } from 'vitest';
import { isConsoleAllowedRole } from '../user';

describe('isConsoleAllowedRole', () => {
  it('mengizinkan admin, root, reviewer', () => {
    expect(isConsoleAllowedRole('admin')).toBe(true);
    expect(isConsoleAllowedRole('root')).toBe(true);
    expect(isConsoleAllowedRole('reviewer')).toBe(true);
  });

  it('menolak contributor, editor, kosong', () => {
    expect(isConsoleAllowedRole('contributor')).toBe(false);
    expect(isConsoleAllowedRole('editor')).toBe(false);
    expect(isConsoleAllowedRole(undefined)).toBe(false);
    expect(isConsoleAllowedRole(null)).toBe(false);
    expect(isConsoleAllowedRole('')).toBe(false);
  });
});
