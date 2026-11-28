import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  batalkanRequest,
  bayarKewajibanRequest,
  catatKeluarRequest,
  catatMasukRequest,
  createKategoriRequest,
  createKewajibanRequest,
  createRekeningRequest,
  getSummaryRequest,
  hibahLoanRequest,
  listKategoriRequest,
  listKewajibanRequest,
  listLoansRequest,
  listPengingatRequest,
  listRekeningRequest,
  listTransaksiRequest,
  refundRequest,
  reimburseRequest,
  rekonsiliasiRequest,
  transferRequest,
  updateKategoriRequest,
  updateKewajibanRequest,
  updateRekeningRequest,
} from '../infrastructure/cashflow-api';

/** Semua data cashflow pakai prefix ini: satu invalidate menyegarkan seluruh modul. */
const KEY = ['cashflow'] as const;

export const useCashflowSummary = (enabled = true) =>
  useQuery({ queryKey: [...KEY, 'summary'], queryFn: getSummaryRequest, enabled });

export const useCashflowTransaksi = (enabled = true) =>
  useQuery({ queryKey: [...KEY, 'transaksi'], queryFn: listTransaksiRequest, enabled });

export const useCashflowLoans = (enabled = true) =>
  useQuery({ queryKey: [...KEY, 'loans'], queryFn: listLoansRequest, enabled });

export const useCashflowPengingat = (enabled = true) =>
  useQuery({ queryKey: [...KEY, 'pengingat'], queryFn: listPengingatRequest, enabled });

export const useCashflowKewajiban = (enabled = true) =>
  useQuery({ queryKey: [...KEY, 'kewajiban'], queryFn: listKewajibanRequest, enabled });

export const useCashflowKategori = (enabled = true) =>
  useQuery({ queryKey: [...KEY, 'kategori'], queryFn: listKategoriRequest, enabled });

export const useCashflowRekening = (enabled = true) =>
  useQuery({ queryKey: [...KEY, 'rekening'], queryFn: listRekeningRequest, enabled });

/** Mutasi apa pun menyegarkan semua data cashflow (saldo, talangan, pengingat berubah bersamaan). */
function useCashflowMutation<TInput, TOutput>(mutationFn: (input: TInput) => Promise<TOutput>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const useCatatMasuk = () => useCashflowMutation(catatMasukRequest);
export const useCatatKeluar = () => useCashflowMutation(catatKeluarRequest);
export const useReimburse = () => useCashflowMutation(reimburseRequest);
export const useRefund = () => useCashflowMutation(refundRequest);
export const useTransfer = () => useCashflowMutation(transferRequest);
export const useBatalkan = () =>
  useCashflowMutation((input: { id: string; alasan_koreksi: string; idempotency_key: string }) =>
    batalkanRequest(input.id, { alasan_koreksi: input.alasan_koreksi, idempotency_key: input.idempotency_key }),
  );
export const useHibahLoan = () =>
  useCashflowMutation((input: { id: string; catatan: string }) => hibahLoanRequest(input.id, input.catatan));
export const useBayarKewajiban = () =>
  useCashflowMutation((input: { id: string } & Parameters<typeof bayarKewajibanRequest>[1]) =>
    bayarKewajibanRequest(input.id, input),
  );
export const useCreateKewajiban = () => useCashflowMutation(createKewajibanRequest);
export const useUpdateKewajiban = () =>
  useCashflowMutation((input: { id: string; aktif?: boolean; berhenti_per?: string | null }) =>
    updateKewajibanRequest(input.id, { aktif: input.aktif, berhenti_per: input.berhenti_per }),
  );
export const useCreateKategori = () => useCashflowMutation(createKategoriRequest);
export const useUpdateKategori = () =>
  useCashflowMutation((input: { id: string; nama?: string; aktif?: boolean }) =>
    updateKategoriRequest(input.id, { nama: input.nama, aktif: input.aktif }),
  );
export const useCreateRekening = () => useCashflowMutation(createRekeningRequest);
export const useUpdateRekening = () =>
  useCashflowMutation((input: { id: string; nama?: string; aktif?: boolean }) =>
    updateRekeningRequest(input.id, { nama: input.nama, aktif: input.aktif }),
  );
export const useRekonsiliasi = () => useCashflowMutation(rekonsiliasiRequest);
