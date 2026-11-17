import { client } from '@/shared/api/client';

export type BalehoPlacementStatus =
  | 'pending_review'
  | 'awaiting_payment'
  | 'live'
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
  impressions?: number;
  taps?: number;
  ctr_percent?: number;
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

/** Byte bukti bayar (root/admin). Caller wajib revokeObjectURL setelah tutup popup. */
export async function fetchPaymentProofBlob(id: string): Promise<string> {
  const res = await client.get<Blob>(
    `/admin/baleho/placements/${id}/payment-proof`,
    { responseType: 'blob' },
  );
  return URL.createObjectURL(res.data);
}
