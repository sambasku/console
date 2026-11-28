import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Alert, App as AntdApp, Button, DatePicker, Form, Input, InputNumber, Modal, Radio, Select, Space, Typography } from 'antd';
import { normalizeError } from '@/shared/api/error';
import { newIdempotencyKey } from '../infrastructure/cashflow-api';
import {
  REKENING_JENIS_LABEL,
  RECURRENCE_LABEL,
  formatRupiah,
  rupiahInputFormatter,
  rupiahInputParser,
  type CashTransaksi,
  type KategoriTransaksi,
  type Kewajiban,
  type KewajibanRecurrence,
  type Loan,
  type PengingatItem,
  type Rekening,
} from '../domain/cashflow';
import {
  useBatalkan,
  useCashflowSummary,
  useCreateKategori,
  useCreateKewajiban,
  useCreateRekening,
  useRefund,
  useReimburse,
  useRekonsiliasi,
  useBayarKewajiban,
  useTransfer,
  useUpdateKewajiban,
} from '../application/use-cashflow';

/*
 * Setiap dialog dimount hanya saat dibuka (parent pakai conditional render),
 * jadi idempotency_key baru setiap kali dibuka. Gagal kirim = kunci sama, aman dicoba ulang.
 */

const ymd = (d: Dayjs | null | undefined): string => (d ? d.format('YYYY-MM-DD') : '');
const ym = (d: Dayjs | null | undefined): string => (d ? d.format('YYYY-MM') : '');

const nominalField = (
  <InputNumber
    min={1}
    precision={0}
    style={{ width: '100%' }}
    formatter={rupiahInputFormatter}
    parser={rupiahInputParser}
    placeholder="Mis. 150.000"
  />
);

const rekeningOptions = (rekening: Rekening[]) =>
  rekening
    .filter((r) => r.aktif)
    .map((r) => ({ value: r.id, label: `${r.nama} (${REKENING_JENIS_LABEL[r.jenis]})` }));

interface DialogProps {
  onClose: () => void;
}

interface DialogFooterProps {
  formId: string;
  loading: boolean;
  okText: string;
  onClose: () => void;
  disabled?: boolean;
}

function DialogFooter({ formId, loading, okText, onClose, disabled = false }: DialogFooterProps) {
  return (
    <Space>
      <Button onClick={onClose}>Batal</Button>
      <Button type="primary" form={formId} htmlType="submit" loading={loading} disabled={disabled}>
        {okText}
      </Button>
    </Space>
  );
}

// ---------------------------------------------------------------- koreksi

interface ReversalDialogProps extends DialogProps {
  target: CashTransaksi;
}

/** Koreksi = transaksi pembalik. Baris asli tidak pernah diubah atau dihapus. */
export function ReversalDialog({ target, onClose }: ReversalDialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useBatalkan();
  const [form] = Form.useForm<{ alasan_koreksi: string }>();
  const [idKey] = useState(newIdempotencyKey);

  const handleFinish = async (values: { alasan_koreksi: string }) => {
    try {
      await mutation.mutateAsync({ id: target.id, alasan_koreksi: values.alasan_koreksi.trim(), idempotency_key: idKey });
      message.success('Koreksi dicatat. Riwayat asli tetap tersimpan.');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title="Koreksi transaksi"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-reversal" loading={mutation.isPending} okText="Catat koreksi" onClose={onClose} />}
    >
      <Typography.Paragraph type="secondary">
        Transaksi tidak dihapus. Sistem mencatat transaksi pembalik supaya riwayat tetap utuh.
        Nominal {formatRupiah(target.nominal)} pada {target.tanggal} akan dibalik.
      </Typography.Paragraph>
      <Form id="cf-reversal" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="alasan_koreksi"
          label="Alasan koreksi"
          rules={[
            { required: true, message: 'Tulis alasannya dulu ya, biar jejaknya jelas' },
            { min: 3, message: 'Alasan minimal 3 karakter' },
            { max: 300, message: 'Maks 300 karakter' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="Mis. Salah input nominal" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- refund donasi

interface RefundDialogProps extends DialogProps {
  source: CashTransaksi;
  rekening: Rekening[];
}

export function RefundDialog({ source, rekening, onClose }: RefundDialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useRefund();
  const [form] = Form.useForm();
  const [idKey] = useState(newIdempotencyKey);

  const handleFinish = async (values: { rekening_id: string; nominal: number; tanggal: Dayjs; catatan?: string }) => {
    try {
      await mutation.mutateAsync({
        refund_dari_id: source.id,
        rekening_id: values.rekening_id,
        nominal: values.nominal,
        tanggal: ymd(values.tanggal),
        catatan: values.catatan?.trim() || undefined,
        idempotency_key: idKey,
      });
      message.success('Refund dicatat');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title="Refund donasi"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-refund" loading={mutation.isPending} okText="Catat refund" onClose={onClose} />}
    >
      <Typography.Paragraph type="secondary">
        Donasi asal {formatRupiah(source.nominal)} tanggal {source.tanggal}. Total refund dari donasi ini tidak boleh lebih dari nominal asalnya.
      </Typography.Paragraph>
      <Form
        id="cf-refund"
        form={form}
        layout="vertical"
        initialValues={{ tanggal: dayjs() }}
        onFinish={handleFinish}
      >
        <Form.Item name="rekening_id" label="Dikeluarkan dari rekening" rules={[{ required: true, message: 'Pilih rekeningnya dulu ya' }]}>
          <Select options={rekeningOptions(rekening)} placeholder="Pilih rekening" />
        </Form.Item>
        <Form.Item name="nominal" label="Nominal refund" rules={[{ required: true, message: 'Nominal wajib diisi ya' }]}>
          {nominalField}
        </Form.Item>
        <Form.Item name="tanggal" label="Tanggal" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
          <DatePicker style={{ width: '100%' }} format="D MMM YYYY" />
        </Form.Item>
        <Form.Item name="catatan" label="Catatan (opsional)">
          <Input placeholder="Mis. Donatur minta dikembalikan" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- reimburse talangan

interface ReimburseDialogProps extends DialogProps {
  loan: Loan;
  rekening: Rekening[];
}

/** Dana masuk dipakai mengembalikan talangan. Nominal default = sisa yang belum kembali. */
export function ReimburseDialog({ loan, rekening, onClose }: ReimburseDialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useReimburse();
  const [form] = Form.useForm();
  const [idKey] = useState(newIdempotencyKey);

  const handleFinish = async (values: { rekening_id: string; nominal: number; tanggal: Dayjs; catatan?: string }) => {
    try {
      await mutation.mutateAsync({
        loan_id: loan.id,
        rekening_id: values.rekening_id,
        nominal: values.nominal,
        tanggal: ymd(values.tanggal),
        catatan: values.catatan?.trim() || undefined,
        idempotency_key: idKey,
      });
      message.success('Talangan dikembalikan');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title={`Kembalikan talangan ${loan.penalang_nama}`}
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-reimburse" loading={mutation.isPending} okText="Kembalikan" onClose={onClose} />}
    >
      <Typography.Paragraph type="secondary">
        Sisa yang belum kembali: {formatRupiah(loan.sisa)}. Kamu bisa mengembalikan sebagian, sisanya nanti.
      </Typography.Paragraph>
      <Form
        id="cf-reimburse"
        form={form}
        layout="vertical"
        initialValues={{ nominal: loan.sisa, tanggal: dayjs() }}
        onFinish={handleFinish}
      >
        <Form.Item name="rekening_id" label="Dari rekening" rules={[{ required: true, message: 'Pilih rekeningnya dulu ya' }]}>
          <Select options={rekeningOptions(rekening)} placeholder="Pilih rekening" />
        </Form.Item>
        <Form.Item name="nominal" label="Nominal" rules={[{ required: true, message: 'Nominal wajib diisi ya' }]}>
          {nominalField}
        </Form.Item>
        <Form.Item name="tanggal" label="Tanggal" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
          <DatePicker style={{ width: '100%' }} format="D MMM YYYY" />
        </Form.Item>
        <Form.Item name="catatan" label="Catatan (opsional)">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- bayar kewajiban (cicilan)

interface BayarDialogProps extends DialogProps {
  item: PengingatItem;
  rekening: Rekening[];
}

export function BayarKewajibanDialog({ item, rekening, onClose }: BayarDialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useBayarKewajiban();
  const [form] = Form.useForm();
  const [idKey] = useState(newIdempotencyKey);

  const handleFinish = async (values: { rekening_id: string; nominal: number; tanggal: Dayjs; catatan?: string }) => {
    try {
      await mutation.mutateAsync({
        id: item.kewajiban_id,
        periode: item.periode,
        rekening_id: values.rekening_id,
        nominal: values.nominal,
        tanggal: ymd(values.tanggal),
        catatan: values.catatan?.trim() || undefined,
        idempotency_key: idKey,
      });
      message.success('Pembayaran dicatat');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title={`Bayar ${item.nama} (${item.periode})`}
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-bayar" loading={mutation.isPending} okText="Catat pembayaran" onClose={onClose} />}
    >
      <Typography.Paragraph type="secondary">
        Sudah dibayar {formatRupiah(item.paid)} dari {formatRupiah(item.nominal_estimasi)}. Sisa {formatRupiah(item.sisa)}.
        Boleh dicicil, status periode dihitung dari total pembayaran.
      </Typography.Paragraph>
      <Form
        id="cf-bayar"
        form={form}
        layout="vertical"
        initialValues={{ nominal: item.sisa, tanggal: dayjs() }}
        onFinish={handleFinish}
      >
        <Form.Item name="rekening_id" label="Dari rekening" rules={[{ required: true, message: 'Pilih rekeningnya dulu ya' }]}>
          <Select options={rekeningOptions(rekening)} placeholder="Pilih rekening" />
        </Form.Item>
        <Form.Item name="nominal" label="Nominal" rules={[{ required: true, message: 'Nominal wajib diisi ya' }]}>
          {nominalField}
        </Form.Item>
        <Form.Item name="tanggal" label="Tanggal" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
          <DatePicker style={{ width: '100%' }} format="D MMM YYYY" />
        </Form.Item>
        <Form.Item name="catatan" label="Catatan (opsional)">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- kewajiban baru

interface KewajibanDialogProps extends DialogProps {
  kategori: KategoriTransaksi[];
}

export function KewajibanDialog({ kategori, onClose }: KewajibanDialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useCreateKewajiban();
  const [form] = Form.useForm();

  const handleFinish = async (values: {
    nama: string;
    nominal_estimasi: number;
    kategori_id: string;
    recurrence: KewajibanRecurrence;
    periode_mulai: Dayjs;
    hari_jatuh_tempo: number;
  }) => {
    try {
      await mutation.mutateAsync({
        nama: values.nama.trim(),
        nominal_estimasi: values.nominal_estimasi,
        kategori_id: values.kategori_id,
        recurrence: values.recurrence,
        periode_mulai: ym(values.periode_mulai),
        hari_jatuh_tempo: values.hari_jatuh_tempo,
      });
      message.success('Pengingat dibuat');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const kategoriKeluar = kategori.filter((k) => k.aktif && k.tipe === 'keluar').map((k) => ({ value: k.id, label: k.nama }));

  return (
    <Modal
      title="Pengingat kewajiban baru"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-kewajiban" loading={mutation.isPending} okText="Buat pengingat" onClose={onClose} />}
    >
      <Form
        id="cf-kewajiban"
        form={form}
        layout="vertical"
        initialValues={{ recurrence: 'bulanan', periode_mulai: dayjs(), hari_jatuh_tempo: 5 }}
        onFinish={handleFinish}
      >
        <Form.Item name="nama" label="Nama kewajiban" rules={[{ required: true, message: 'Nama wajib diisi ya' }]}>
          <Input placeholder="Mis. Listrik server" />
        </Form.Item>
        <Form.Item name="nominal_estimasi" label="Perkiraan nominal" rules={[{ required: true, message: 'Nominal wajib diisi ya' }]}>
          {nominalField}
        </Form.Item>
        <Form.Item name="kategori_id" label="Kategori" rules={[{ required: true, message: 'Pilih kategorinya dulu ya' }]}>
          <Select options={kategoriKeluar} placeholder="Pilih kategori pengeluaran" />
        </Form.Item>
        <Form.Item name="recurrence" label="Pengulangan">
          <Radio.Group
            options={(Object.keys(RECURRENCE_LABEL) as KewajibanRecurrence[]).map((v) => ({ value: v, label: RECURRENCE_LABEL[v] }))}
            optionType="button"
          />
        </Form.Item>
        <Form.Item name="periode_mulai" label="Mulai periode" rules={[{ required: true, message: 'Pilih bulan mulainya' }]}>
          <DatePicker picker="month" style={{ width: '100%' }} format="MMM YYYY" />
        </Form.Item>
        <Form.Item
          name="hari_jatuh_tempo"
          label="Jatuh tempo tanggal"
          rules={[{ required: true, message: 'Isi tanggal 1 sampai 31' }]}
        >
          <InputNumber min={1} max={31} precision={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- berhentikan langganan

interface BerhentiDialogProps extends DialogProps {
  item: Kewajiban;
}

/** Berhenti = pengingat tidak muncul lagi setelah tanggal ini. Bisa diaktifkan lagi nanti. */
export function BerhentiDialog({ item, onClose }: BerhentiDialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useUpdateKewajiban();
  const [form] = Form.useForm();

  const handleFinish = async (values: { berhenti_per: Dayjs }) => {
    try {
      await mutation.mutateAsync({ id: item.id, aktif: false, berhenti_per: ymd(values.berhenti_per) });
      message.success('Pengingat dihentikan');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title={`Hentikan ${item.nama}`}
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-berhenti" loading={mutation.isPending} okText="Hentikan" onClose={onClose} />}
    >
      <Form id="cf-berhenti" form={form} layout="vertical" initialValues={{ berhenti_per: dayjs() }} onFinish={handleFinish}>
        <Form.Item name="berhenti_per" label="Berhenti mulai" rules={[{ required: true, message: 'Pilih tanggalnya dulu ya' }]}>
          <DatePicker style={{ width: '100%' }} format="D MMM YYYY" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- transfer antar rekening

export function TransferDialog({ rekening, onClose }: DialogProps & { rekening: Rekening[] }) {
  const { message } = AntdApp.useApp();
  const mutation = useTransfer();
  const summary = useCashflowSummary();
  const [form] = Form.useForm();
  const [idKey] = useState(newIdempotencyKey);
  const dari = Form.useWatch('dari_rekening_id', form);
  const ke = Form.useWatch('ke_rekening_id', form);
  const nominal = Form.useWatch('nominal', form) ?? 0;

  const saldoMap = new Map((summary.data?.rekening ?? []).map((r) => [r.id, r.saldo]));
  const namaMap = new Map(rekening.map((r) => [r.id, r.nama]));
  const aktif = rekening.filter((r) => r.aktif);
  const saldoLabel = (r: Rekening) =>
    `${r.nama} (${REKENING_JENIS_LABEL[r.jenis]}) - saldo ${formatRupiah(saldoMap.get(r.id) ?? 0)}`;
  const dariOptions = aktif.map((r) => ({ value: r.id, label: saldoLabel(r), disabled: r.id === ke }));
  const keOptions = aktif.map((r) => ({ value: r.id, label: saldoLabel(r), disabled: r.id === dari }));

  const saldoDari = dari && summary.data ? (saldoMap.get(dari) ?? 0) : null;
  const kurang = saldoDari !== null && nominal > saldoDari;
  const sama = !!dari && dari === ke;

  const handleFinish = async (values: {
    dari_rekening_id: string;
    ke_rekening_id: string;
    nominal: number;
    tanggal: Dayjs;
    catatan?: string;
  }) => {
    try {
      await mutation.mutateAsync({
        dari_rekening_id: values.dari_rekening_id,
        ke_rekening_id: values.ke_rekening_id,
        nominal: values.nominal,
        tanggal: ymd(values.tanggal),
        catatan: values.catatan?.trim() || undefined,
        idempotency_key: idKey,
      });
      message.success('Transfer dicatat');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title="Pindah dana antar rekening"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={
        <DialogFooter
          formId="cf-transfer"
          loading={mutation.isPending}
          okText="Catat transfer"
          onClose={onClose}
          disabled={kurang || sama}
        />
      }
    >
      <Typography.Paragraph type="secondary">
        Transfer tidak mengubah total kas. Yang berubah hanya posisi per rekening.
      </Typography.Paragraph>
      <Form
        id="cf-transfer"
        form={form}
        layout="vertical"
        initialValues={{ tanggal: dayjs() }}
        onFinish={handleFinish}
        onValuesChange={(changed) => {
          // Rekening asal diganti jadi sama dengan tujuan: kosongkan tujuan, jangan biarkan pasangan sama.
          if ('dari_rekening_id' in changed && changed.dari_rekening_id === form.getFieldValue('ke_rekening_id')) {
            form.setFieldValue('ke_rekening_id', undefined);
          }
        }}
      >
        <Form.Item name="dari_rekening_id" label="Dari rekening" rules={[{ required: true, message: 'Pilih asalnya dulu ya' }]}>
          <Select options={dariOptions} placeholder="Pilih rekening asal" />
        </Form.Item>
        <Form.Item name="ke_rekening_id" label="Ke rekening" rules={[{ required: true, message: 'Pilih tujuannya dulu ya' }]}>
          <Select options={keOptions} placeholder="Pilih rekening tujuan" />
        </Form.Item>
        {sama ? <Alert type="error" showIcon style={{ marginBottom: 16 }} message="Rekening asal dan tujuan tidak boleh sama." /> : null}
        <Form.Item name="nominal" label="Nominal" rules={[{ required: true, message: 'Nominal wajib diisi ya' }]}>
          {nominalField}
        </Form.Item>
        {kurang && saldoDari !== null ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Saldo ${namaMap.get(dari!)} ${formatRupiah(saldoDari)}, kurang ${formatRupiah(nominal - saldoDari)}. Kurangi nominal atau pilih rekening asal lain.`}
          />
        ) : null}
        <Form.Item name="tanggal" label="Tanggal" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
          <DatePicker style={{ width: '100%' }} format="D MMM YYYY" />
        </Form.Item>
        <Form.Item name="catatan" label="Catatan (opsional)">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- rekonsiliasi

export function RekonsiliasiDialog({ rekening, onClose }: DialogProps & { rekening: Rekening[] }) {
  const { message } = AntdApp.useApp();
  const mutation = useRekonsiliasi();
  const [form] = Form.useForm();

  const handleFinish = async (values: { rekening_id: string; tanggal: Dayjs; saldo_bank: number; catatan?: string }) => {
    try {
      const res = await mutation.mutateAsync({
        rekening_id: values.rekening_id,
        tanggal: ymd(values.tanggal),
        saldo_bank: values.saldo_bank,
        catatan: values.catatan?.trim() || undefined,
      });
      message.success(
        res.selisih === 0
          ? 'Cocok. Saldo ledger sama dengan saldo bank.'
          : `Ada selisih ${formatRupiah(res.selisih)}. Catat biaya admin atau bunga supaya cocok.`,
      );
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title="Cocokkan dengan saldo bank"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-rekon" loading={mutation.isPending} okText="Simpan rekonsiliasi" onClose={onClose} />}
    >
      <Form id="cf-rekon" form={form} layout="vertical" initialValues={{ tanggal: dayjs() }} onFinish={handleFinish}>
        <Form.Item name="rekening_id" label="Rekening" rules={[{ required: true, message: 'Pilih rekeningnya dulu ya' }]}>
          <Select options={rekeningOptions(rekening)} />
        </Form.Item>
        <Form.Item name="tanggal" label="Per tanggal" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
          <DatePicker style={{ width: '100%' }} format="D MMM YYYY" />
        </Form.Item>
        <Form.Item name="saldo_bank" label="Saldo di rekening bank" rules={[{ required: true, message: 'Isi saldo dari mutasi bank' }]}>
          <InputNumber precision={0} style={{ width: '100%' }} formatter={rupiahInputFormatter} parser={rupiahInputParser} />
        </Form.Item>
        <Form.Item name="catatan" label="Catatan (opsional)">
          <Input placeholder="Mis. Selisih bunga bank bulan ini" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------- kategori & rekening

export function KategoriDialog({ onClose }: DialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useCreateKategori();
  const [form] = Form.useForm();

  const handleFinish = async (values: { kode: string; nama: string; tipe: 'masuk' | 'keluar' }) => {
    try {
      await mutation.mutateAsync({ kode: values.kode.trim().toUpperCase(), nama: values.nama.trim(), tipe: values.tipe });
      message.success('Kategori dibuat');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title="Kategori baru"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-kategori" loading={mutation.isPending} okText="Buat" onClose={onClose} />}
    >
      <Form id="cf-kategori" form={form} layout="vertical" initialValues={{ tipe: 'keluar' }} onFinish={handleFinish}>
        <Form.Item name="tipe" label="Jenis">
          <Radio.Group
            optionType="button"
            options={[
              { value: 'masuk', label: 'Uang masuk' },
              { value: 'keluar', label: 'Uang keluar' },
            ]}
          />
        </Form.Item>
        <Form.Item name="kode" label="Kode" rules={[{ required: true, message: 'Kode wajib diisi' }, { min: 2, max: 20, message: 'Kode 2 sampai 20 karakter' }]}>
          <Input placeholder="Mis. KLR-EVT" />
        </Form.Item>
        <Form.Item name="nama" label="Nama" rules={[{ required: true, message: 'Nama wajib diisi ya' }, { max: 80, message: 'Maks 80 karakter' }]}>
          <Input placeholder="Mis. Event dan komunitas" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function RekeningDialog({ onClose }: DialogProps) {
  const { message } = AntdApp.useApp();
  const mutation = useCreateRekening();
  const [form] = Form.useForm();

  const handleFinish = async (values: { nama: string; jenis: 'bank' | 'tunai' | 'dompet'; saldo_awal: number }) => {
    try {
      await mutation.mutateAsync({ nama: values.nama.trim(), jenis: values.jenis, saldo_awal: values.saldo_awal ?? 0 });
      message.success('Rekening dibuat');
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title="Rekening baru"
      open
      onCancel={onClose}
      destroyOnHidden
      footer={<DialogFooter formId="cf-rekening" loading={mutation.isPending} okText="Buat" onClose={onClose} />}
    >
      <Form id="cf-rekening" form={form} layout="vertical" initialValues={{ jenis: 'bank', saldo_awal: 0 }} onFinish={handleFinish}>
        <Form.Item name="nama" label="Nama rekening" rules={[{ required: true, message: 'Nama wajib diisi ya' }]}>
          <Input placeholder="Mis. BCA Sambasku" />
        </Form.Item>
        <Form.Item name="jenis" label="Jenis">
          <Select options={Object.entries(REKENING_JENIS_LABEL).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        <Form.Item name="saldo_awal" label="Saldo awal">
          <InputNumber precision={0} style={{ width: '100%' }} formatter={rupiahInputFormatter} parser={rupiahInputParser} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

