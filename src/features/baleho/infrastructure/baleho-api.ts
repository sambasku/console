import { client } from '@/shared/api/client';

export type BalehoPlacementStatus =
  | 'pending_review'
  | 'awaiting_payment'
  | 'live'
  | 'paused'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface BalehoPlacementWire {
  id: string;
  slide: number;
  col: number;
  row: number;
  w: number;
  h: number;
  status: BalehoPlacementStatus;
  advertiser_user_id: string;
  advertiser_username: string | null;
  referral_username: string | null;
  /** Ada bukti di server - preview lewat fetchPaymentProofBlob, bukan URL CDN. */
  has_payment_proof: boolean;
  quoted_amount: number | null;
  price_per_cell_per_day: number | null;
  days: number | null;
  created_at: string;
  /** WA konfirmasi pembayaran (format internasional 62…/60…). */
  confirmation_phone: string | null;
  /** Jadwal booking YYYY-MM-DD (WIB), dari `starts_on` pesan. */
  scheduled_starts_on: string | null;
  /** Akhir jendela booking YYYY-MM-DD (WIB), `starts_on` + hari - 1. */
  scheduled_ends_on: string | null;
  /** Tayang aktual (ISO) setelah mark-paid. */
  starts_at: string | null;
  /** ISO; null jika belum live/belum di-set. */
  ends_at: string | null;
  impressions?: number;
  taps?: number;
  /** Klik tombol CTA (`event_type=action`). */
  actions?: number;
  action_success?: number;
  action_fail?: number;
  ctr_percent?: number;
  action_rate_percent?: number;
  success_rate_percent?: number;
  cpm_idr?: number | null;
  cpc_idr?: number | null;
  daily?: Array<{
    date: string;
    impressions: number;
    taps: number;
    actions: number;
  }>;
}

export async function listAdminBaleho(
  signal?: AbortSignal,
): Promise<BalehoPlacementWire[]> {
  const res = await client.get<{
    success: true;
    data: BalehoPlacementWire[];
  }>('/admin/baleho/placements', { signal });
  return res.data.data;
}

export async function approveBaleho(id: string): Promise<void> {
  await client.post(`/admin/baleho/placements/${id}/approve`);
}

export async function rejectBaleho(id: string, reason?: string): Promise<void> {
  await client.post(`/admin/baleho/placements/${id}/reject`, { reason });
}

export async function markPaidBaleho(
  id: string,
  proof: { paymentProofUrl: string; paymentProofFileId: string },
): Promise<void> {
  await client.post(`/admin/baleho/placements/${id}/mark-paid`, {
    payment_proof_url: proof.paymentProofUrl,
    payment_proof_file_id: proof.paymentProofFileId,
  });
}

export async function pauseBaleho(id: string, reason?: string): Promise<void> {
  await client.post(`/admin/baleho/placements/${id}/pause`, { reason });
}

export async function resumeBaleho(id: string): Promise<void> {
  await client.post(`/admin/baleho/placements/${id}/resume`);
}

/** Byte bukti bayar (root/admin). Caller wajib revokeObjectURL setelah tutup popup. */
export async function fetchPaymentProofBlob(id: string): Promise<string> {
  const res = await client.get<Blob>(
    `/admin/baleho/placements/${id}/payment-proof`,
    { responseType: 'blob' },
  );
  return URL.createObjectURL(res.data);
}
