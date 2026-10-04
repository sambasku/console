import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api/error';
import { describeRequestError, resolveProviderView } from '../../application/provider-state';
import type { ProviderResult } from '../../domain/web-analytics';

const base: ProviderResult<{ n: number }> = { status: 'ok', error_code: null, message: null, range: null, data: { n: 1 } };

describe('resolveProviderView', () => {
  it('pending atau belum ada hasil → loading', () => {
    expect(resolveProviderView({ isPending: true, result: base })).toEqual({ kind: 'loading' });
    expect(resolveProviderView({ isPending: false, result: undefined })).toEqual({ kind: 'loading' });
  });

  it('not_configured, error, empty, ok dibedakan', () => {
    const view = (r: Partial<ProviderResult<{ n: number }>>) =>
      resolveProviderView({ isPending: false, result: { ...base, ...r } });
    expect(view({ status: 'not_configured', data: null })).toEqual({ kind: 'not_configured' });
    expect(view({ status: 'error', error_code: 'GA4_RATE_LIMITED', message: 'Kuota penuh', data: null })).toEqual({
      kind: 'error',
      code: 'GA4_RATE_LIMITED',
      message: 'Kuota penuh',
    });
    expect(view({ status: 'empty', data: null })).toEqual({ kind: 'empty' });
    expect(view({})).toEqual({ kind: 'ok', data: { n: 1 } });
  });

  it('ok tanpa data dianggap kosong, bukan error', () => {
    expect(resolveProviderView({ isPending: false, result: { ...base, data: null } })).toEqual({ kind: 'empty' });
  });
});

describe('describeRequestError', () => {
  it('pesan sesuai penyebab, bukan selalu "cek koneksi"', () => {
    expect(describeRequestError(new ApiError(404, 'NOT_FOUND', 'x'))).toContain('Deploy API terbaru');
    expect(describeRequestError(new ApiError(403, 'FORBIDDEN', 'Kamu belum punya akses untuk fitur ini.'))).toBe(
      'Kamu belum punya akses untuk fitur ini.',
    );
    expect(describeRequestError(new ApiError(0, 'NETWORK_ERROR', 'x'))).toContain('koneksi internet');
    expect(describeRequestError(new ApiError(500, 'INTERNAL', 'stack...'))).not.toContain('stack');
  });
});
