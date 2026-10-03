import { normalizeError } from '@/shared/api/error';
import type { ProviderResult } from '../domain/web-analytics';

export type ProviderView<T> =
  | { kind: 'loading' }
  | { kind: 'not_configured' }
  | { kind: 'error'; code: string; message: string }
  | { kind: 'empty' }
  | { kind: 'ok'; data: T };

/**
 * State blok satu provider (API sehat, Google mungkin menolak/gagal). Gagal
 * request ke API kita sendiri ditangani SEKALI per tab oleh
 * `RequestErrorAlert`, bukan per provider. Data kosong bukan error.
 */
export function resolveProviderView<T>(input: {
  isPending: boolean;
  result: ProviderResult<T> | undefined;
}): ProviderView<T> {
  const result = input.result;
  if (input.isPending || !result) return { kind: 'loading' };
  switch (result.status) {
    case 'not_configured':
      return { kind: 'not_configured' };
    case 'error':
      return {
        kind: 'error',
        code: result.error_code ?? 'UNKNOWN',
        message: result.message ?? 'Data belum bisa dimuat. Coba lagi sebentar lagi.',
      };
    case 'empty':
      return { kind: 'empty' };
    case 'ok':
      return result.data ? { kind: 'ok', data: result.data } : { kind: 'empty' };
  }
}

/** Pesan gagal request ke API, sesuai penyebab (bukan selalu "cek koneksi"). */
export function describeRequestError(err: unknown): string {
  const e = normalizeError(err);
  if (e.status === 404) {
    return 'Endpoint Trafik Web belum ada di API yang dipakai. Deploy API terbaru dulu, lalu muat ulang.';
  }
  if (e.status === 400 || e.status === 403) return e.message;
  if (e.status === 0) return 'Cek koneksi internet kamu, lalu coba lagi.';
  return 'Server lagi bermasalah. Coba lagi sebentar lagi.';
}
