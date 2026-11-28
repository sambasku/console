import { client } from '@/shared/api/client';
import type {
  CashTransaksi,
  CashflowSummary,
  DonaturTipe,
  LookupItem,
  KategoriTransaksi,
  Kewajiban,
  KewajibanRecurrence,
  Loan,
  PengingatItem,
  Rekening,
  RekeningJenis,
  Rekonsiliasi,
  CashTipe,
  CashLampiran,
} from '../domain/cashflow';

interface Envelope<T> {
  success: true;
  data: T;
}

const BASE = '/admin/cashflow';

/** Kunci idempotensi per form. Sama kunci = transaksi tidak tercatat dua kali. */
export const newIdempotencyKey = (): string => crypto.randomUUID();

export interface TalanganInput {
  penalang_user_id?: string | null;
  penalang_nama: string;
  pokok: number;
}

export interface KeluarBody {
  kategori_id: string;
  rekening_id: string;
  nominal: number;
  tanggal: string;
  catatan?: string;
  penerima_nama?: string | null;
  talangan?: TalanganInput[];
  idempotency_key: string;
}

export interface MasukBody {
  kategori_id: string;
  rekening_id: string;
  nominal: number;
  tanggal: string;
  catatan?: string;
  donatur_tipe?: DonaturTipe | null;
  donatur_user_id?: string | null;
  donatur_usaha_id?: string | null;
  donatur_nama?: string | null;
  idempotency_key: string;
}

export interface ReimburseBody {
  loan_id: string;
  rekening_id: string;
  nominal: number;
  tanggal: string;
  catatan?: string;
  idempotency_key: string;
}

export interface RefundBody {
  refund_dari_id: string;
  rekening_id: string;
  nominal: number;
  tanggal: string;
  catatan?: string;
  idempotency_key: string;
}

export interface TransferBody {
  dari_rekening_id: string;
  ke_rekening_id: string;
  nominal: number;
  tanggal: string;
  catatan?: string;
  idempotency_key: string;
}

export interface PembayaranBody {
  periode: string;
  rekening_id: string;
  nominal: number;
  tanggal: string;
  catatan?: string;
  idempotency_key: string;
}

export interface KewajibanCreateBody {
  nama: string;
  nominal_estimasi: number;
  kategori_id: string;
  recurrence: KewajibanRecurrence;
  periode_mulai: string;
  hari_jatuh_tempo: number;
}

export async function getSummaryRequest(): Promise<CashflowSummary> {
  const res = await client.get<Envelope<CashflowSummary>>(`${BASE}/summary`);
  return res.data.data;
}

export async function listTransaksiRequest(): Promise<CashTransaksi[]> {
  const res = await client.get<Envelope<CashTransaksi[]>>(`${BASE}/transactions`, { params: { limit: 100 } });
  return res.data.data;
}

export async function listLampiranRequest(txId: string): Promise<CashLampiran[]> {
  const res = await client.get<Envelope<CashLampiran[]>>(`${BASE}/transactions/${txId}/attachments`);
  return res.data.data;
}

/** Unggah satu file. Server mendedupe sha256, jadi mengulang unggah file yang sama aman. */
export async function uploadLampiranRequest(txId: string, file: File): Promise<CashLampiran> {
  const form = new FormData();
  form.append('file', file);
  // Hapus Content-Type default JSON dari client supaya browser memasang boundary multipart.
  const res = await client.post<Envelope<CashLampiran>>(`${BASE}/transactions/${txId}/attachments`, form, {
    headers: { 'Content-Type': undefined },
  });
  return res.data.data;
}

export async function lampiranUrlRequest(id: string): Promise<{ url: string; expires_in: number }> {
  const res = await client.get<Envelope<{ url: string; expires_in: number }>>(`${BASE}/attachments/${id}/url`);
  return res.data.data;
}

export async function hapusLampiranRequest(id: string): Promise<CashLampiran> {
  const res = await client.delete<Envelope<CashLampiran>>(`${BASE}/attachments/${id}`);
  return res.data.data;
}

/** Cari akun (`user`) atau usaha (`usaha`) untuk dipilih. Kata kunci minimal 2 huruf. */
export async function lookupRequest(kind: 'user' | 'usaha', q: string, signal?: AbortSignal): Promise<LookupItem[]> {
  const res = await client.get<Envelope<LookupItem[]>>(`${BASE}/lookup/${kind === 'user' ? 'users' : 'usaha'}`, {
    params: { q },
    signal,
  });
  return res.data.data;
}

export async function listLoansRequest(): Promise<Loan[]> {
  const res = await client.get<Envelope<Loan[]>>(`${BASE}/loans`);
  return res.data.data;
}

export async function listPengingatRequest(): Promise<PengingatItem[]> {
  const res = await client.get<Envelope<PengingatItem[]>>(`${BASE}/pengingat`);
  return res.data.data;
}

export async function listKewajibanRequest(): Promise<Kewajiban[]> {
  const res = await client.get<Envelope<Kewajiban[]>>(`${BASE}/kewajiban`);
  return res.data.data;
}

export async function createKewajibanRequest(body: KewajibanCreateBody): Promise<Kewajiban> {
  const res = await client.post<Envelope<Kewajiban>>(`${BASE}/kewajiban`, body);
  return res.data.data;
}

export async function updateKewajibanRequest(
  id: string,
  body: { aktif?: boolean; berhenti_per?: string | null },
): Promise<Kewajiban> {
  const res = await client.patch<Envelope<Kewajiban>>(`${BASE}/kewajiban/${id}`, body);
  return res.data.data;
}

export async function bayarKewajibanRequest(id: string, body: PembayaranBody): Promise<CashTransaksi> {
  const res = await client.post<Envelope<CashTransaksi>>(`${BASE}/kewajiban/${id}/pembayaran`, body);
  return res.data.data;
}

export async function listKategoriRequest(): Promise<KategoriTransaksi[]> {
  const res = await client.get<Envelope<KategoriTransaksi[]>>(`${BASE}/categories`);
  return res.data.data;
}

export async function createKategoriRequest(body: {
  kode: string;
  nama: string;
  tipe: CashTipe;
}): Promise<KategoriTransaksi> {
  const res = await client.post<Envelope<KategoriTransaksi>>(`${BASE}/categories`, body);
  return res.data.data;
}

export async function updateKategoriRequest(
  id: string,
  body: { nama?: string; aktif?: boolean },
): Promise<KategoriTransaksi> {
  const res = await client.patch<Envelope<KategoriTransaksi>>(`${BASE}/categories/${id}`, body);
  return res.data.data;
}

export async function listRekeningRequest(): Promise<Rekening[]> {
  const res = await client.get<Envelope<Rekening[]>>(`${BASE}/rekening`);
  return res.data.data;
}

export async function createRekeningRequest(body: {
  nama: string;
  jenis: RekeningJenis;
  saldo_awal: number;
}): Promise<Rekening> {
  const res = await client.post<Envelope<Rekening>>(`${BASE}/rekening`, body);
  return res.data.data;
}

export async function updateRekeningRequest(id: string, body: { nama?: string; aktif?: boolean }): Promise<Rekening> {
  const res = await client.patch<Envelope<Rekening>>(`${BASE}/rekening/${id}`, body);
  return res.data.data;
}

export async function catatMasukRequest(body: MasukBody): Promise<CashTransaksi> {
  const res = await client.post<Envelope<CashTransaksi>>(`${BASE}/transactions/masuk`, body);
  return res.data.data;
}

export async function catatKeluarRequest(
  body: KeluarBody,
): Promise<{ transaksi: CashTransaksi; loans: Loan[] }> {
  const res = await client.post<Envelope<{ transaksi: CashTransaksi; loans: Loan[] }>>(
    `${BASE}/transactions/keluar`,
    body,
  );
  return res.data.data;
}

export async function reimburseRequest(body: ReimburseBody): Promise<CashTransaksi> {
  const res = await client.post<Envelope<CashTransaksi>>(`${BASE}/transactions/reimburse`, body);
  return res.data.data;
}

export async function refundRequest(body: RefundBody): Promise<CashTransaksi> {
  const res = await client.post<Envelope<CashTransaksi>>(`${BASE}/transactions/refund`, body);
  return res.data.data;
}

export async function transferRequest(body: TransferBody): Promise<CashTransaksi[]> {
  const res = await client.post<Envelope<CashTransaksi[]>>(`${BASE}/transactions/transfer`, body);
  return res.data.data;
}

export async function batalkanRequest(
  id: string,
  body: { alasan_koreksi: string; idempotency_key: string },
): Promise<CashTransaksi> {
  const res = await client.post<Envelope<CashTransaksi>>(`${BASE}/transactions/${id}/reversal`, body);
  return res.data.data;
}

export async function hibahLoanRequest(id: string, catatan: string): Promise<Loan> {
  const res = await client.post<Envelope<Loan>>(`${BASE}/loans/${id}/hibah`, { catatan });
  return res.data.data;
}

export async function rekonsiliasiRequest(body: {
  rekening_id: string;
  tanggal: string;
  saldo_bank: number;
  catatan?: string;
}): Promise<Rekonsiliasi> {
  const res = await client.post<Envelope<Rekonsiliasi>>(`${BASE}/rekonsiliasi`, body);
  return res.data.data;
}
