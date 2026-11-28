// Tipe wire dari /api/v1/admin/cashflow (snake_case, sama dengan API).

export type CashTipe = 'masuk' | 'keluar';
export type RekeningJenis = 'bank' | 'tunai' | 'dompet';
export type KewajibanRecurrence = 'sekali' | 'bulanan' | 'tahunan';
export type PeriodeStatus = 'belum' | 'sebagian' | 'lunas';
export type LoanStatus = 'outstanding' | 'lunas' | 'dihibahkan' | 'dibatalkan';

export interface SummaryRekening {
  id: string;
  nama: string;
  jenis: RekeningJenis;
  saldo: number;
}

export interface CashflowSummary {
  rekening: SummaryRekening[];
  kas_fisik: number;
  sisa_talangan: number;
  saldo_bersih: number;
}

export interface CashTransaksi {
  id: string;
  tipe: CashTipe;
  kategori_id: string | null;
  kategori_sistem: string | null;
  nominal: number;
  tanggal: string;
  catatan: string;
  rekening_id: string;
  loan_id: string | null;
  kewajiban_id: string | null;
  periode: string | null;
  dibatalkan_dari_id: string | null;
  alasan_koreksi: string | null;
  refund_dari_id: string | null;
  transfer_pair_id: string | null;
  penerima_nama: string | null;
  donatur_nama: string | null;
  donatur_tipe: DonaturTipe | null;
  donatur_user_id: string | null;
  donatur_usaha_id: string | null;
  /** Jumlah lampiran bukti yang belum dihapus. Hanya ada di daftar transaksi. */
  lampiran_count?: number;
  created_at: string;
}

/** Lampiran bukti transaksi (PDF atau gambar). File disimpan privat, dibuka lewat URL sementara. */
export interface CashLampiran {
  id: string;
  transaction_id: string;
  original_name: string;
  mime: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  size_bytes: number;
  sha256: string;
  uploaded_by: string | null;
  created_at: string;
}

export type DonaturTipe = 'perorangan' | 'usaha';

/** Hasil pencarian akun atau usaha untuk picker donatur, sponsor, dan penalang. */
export interface LookupItem {
  id: string;
  nama: string;
  detail: string;
}

/** Nilai picker: `id` terisi jika memilih akun/usaha, null jika nama bebas tanpa akun. */
export interface PartyValue {
  id: string | null;
  nama: string;
}

export interface Loan {
  id: string;
  penalang_user_id: string | null;
  penalang_nama: string;
  pokok: number;
  reimbursed: number;
  sisa: number;
  tanggal_talangan: string;
  pengeluaran_tx_id: string;
  status: LoanStatus;
  version: number;
}

export interface PengingatItem {
  kewajiban_id: string;
  nama: string;
  periode: string;
  due_date: string;
  nominal_estimasi: number;
  paid: number;
  sisa: number;
  status: PeriodeStatus;
  terlewat: boolean;
}

export interface Kewajiban {
  id: string;
  nama: string;
  nominal_estimasi: number;
  kategori_id: string;
  recurrence: KewajibanRecurrence;
  periode_mulai: string;
  hari_jatuh_tempo: number;
  aktif: boolean;
  berhenti_per: string | null;
}

export interface KategoriTransaksi {
  id: string;
  kode: string;
  nama: string;
  tipe: CashTipe;
  aktif: boolean;
}

export interface Rekening {
  id: string;
  nama: string;
  jenis: RekeningJenis;
  saldo_awal: number;
  aktif: boolean;
}

export interface Rekonsiliasi {
  id: string;
  rekening_id: string;
  tanggal: string;
  saldo_bank: number;
  saldo_ledger: number;
  selisih: number;
  catatan: string;
}

/** Kode kategori jasa freelance/reward: wajib isi nama penerima (lihat API). */
export const KODE_KATEGORI_JASA = 'KLR-JSA';

export const REKENING_JENIS_LABEL: Record<RekeningJenis, string> = {
  bank: 'Bank',
  tunai: 'Tunai',
  dompet: 'Dompet digital',
};

export const RECURRENCE_LABEL: Record<KewajibanRecurrence, string> = {
  sekali: 'Sekali',
  bulanan: 'Bulanan',
  tahunan: 'Tahunan',
};

export const PERIODE_STATUS_LABEL: Record<PeriodeStatus, string> = {
  belum: 'Belum dibayar',
  sebagian: 'Sebagian',
  lunas: 'Lunas',
};

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  outstanding: 'Belum kembali',
  lunas: 'Lunas',
  dihibahkan: 'Dihibahkan',
  dibatalkan: 'Dibatalkan',
};

/** Rupiah untuk UI: `Rp 1.500.000`, minus di depan: `-Rp 130.000`. */
export function formatRupiah(value: number | null | undefined): string {
  if (value == null) return '-';
  const sign = value < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(value).toLocaleString('id-ID')}`;
}

/** Input angka dengan pemisah ribuan titik (format id-ID). */
export const rupiahInputFormatter = (value: number | string | undefined): string =>
  value == null ? '' : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const rupiahInputParser = (value: string | undefined): number =>
  Number((value ?? '').replace(/\./g, '')) || 0;
