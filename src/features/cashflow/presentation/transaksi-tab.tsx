import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { App as AntdApp, Alert, Button, Card, DatePicker, Flex, Form, Input, InputNumber, Radio, Select, Space, Table, Tag, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined, UndoOutlined, RetweetOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { formatDate } from '@/shared/utils/format-datetime';
import { newIdempotencyKey } from '../infrastructure/cashflow-api';
import {
  KODE_KATEGORI_JASA,
  formatRupiah,
  rupiahInputFormatter,
  rupiahInputParser,
  type CashTipe,
  type CashTransaksi,
  type KategoriTransaksi,
} from '../domain/cashflow';
import {
  useCashflowKategori,
  useCashflowRekening,
  useCashflowSummary,
  useCashflowTransaksi,
  useCatatKeluar,
  useCatatMasuk,
} from '../application/use-cashflow';
import { RefundDialog, ReversalDialog } from './cashflow-dialogs';

const KODE_DONASI = 'MSK-DON';

const SISTEM_LABEL: Record<string, string> = {
  talangan: 'Dana ditalangi',
  reimburse: 'Pengembalian talangan',
  refund: 'Refund donasi',
  reversal: 'Koreksi',
  transfer: 'Pindah rekening',
};

interface FormValues {
  tipe: CashTipe;
  kategori_id?: string;
  rekening_id?: string;
  nominal?: number;
  tanggal: dayjs.Dayjs;
  catatan?: string;
  donatur_nama?: string;
  penerima_nama?: string;
  talangan?: { penalang_nama?: string; pokok?: number }[];
}

function labelTransaksi(row: CashTransaksi, kategoriMap: Map<string, KategoriTransaksi>): string {
  if (row.kewajiban_id) return `Pembayaran kewajiban ${row.periode ?? ''}`.trim();
  if (row.kategori_id) return kategoriMap.get(row.kategori_id)?.nama ?? row.kategori_id;
  return SISTEM_LABEL[row.kategori_sistem ?? ''] ?? '-';
}

/** Tab transaksi: catat uang masuk/keluar, talangan, dan riwayat (dengan koreksi & refund). */
export function TransaksiTab() {
  const { message } = AntdApp.useApp();
  const summary = useCashflowSummary();
  const kategoriQ = useCashflowKategori();
  const rekeningQ = useCashflowRekening();
  const transaksiQ = useCashflowTransaksi();
  const catatMasuk = useCatatMasuk();
  const catatKeluar = useCatatKeluar();

  const [form] = Form.useForm<FormValues>();
  const [idKey, setIdKey] = useState(newIdempotencyKey);
  const [reversalTarget, setReversalTarget] = useState<CashTransaksi | null>(null);
  const [refundSource, setRefundSource] = useState<CashTransaksi | null>(null);

  const kategori = useMemo(() => kategoriQ.data ?? [], [kategoriQ.data]);
  const rekening = useMemo(() => rekeningQ.data ?? [], [rekeningQ.data]);
  const kategoriMap = useMemo(() => new Map(kategori.map((k) => [k.id, k])), [kategori]);
  const rekeningMap = useMemo(() => new Map(rekening.map((r) => [r.id, r])), [rekening]);

  const tipe = Form.useWatch('tipe', form) ?? 'keluar';
  const kategoriId = Form.useWatch('kategori_id', form);
  const rekeningId = Form.useWatch('rekening_id', form);
  const nominal = Form.useWatch('nominal', form) ?? 0;
  const talanganRows = Form.useWatch('talangan', form) ?? [];

  const kategoriAktif = kategori.filter((k) => k.aktif && k.tipe === tipe);
  const kategoriTerpilih = kategori.find((k) => k.id === kategoriId);
  const butuhPenerima = tipe === 'keluar' && kategoriTerpilih?.kode === KODE_KATEGORI_JASA;

  const kasRekening = rekeningId ? (summary.data?.rekening.find((r) => r.id === rekeningId)?.saldo ?? 0) : 0;
  const kurang = tipe === 'keluar' ? Math.max(0, nominal - kasRekening) : 0;
  const totalTalangan = talanganRows.reduce((acc, t) => acc + (Number(t?.pokok) || 0), 0);

  const saving = catatMasuk.isPending || catatKeluar.isPending;

  const resetForm = () => {
    form.resetFields();
    form.setFieldsValue({ tipe, tanggal: dayjs() });
    setIdKey(newIdempotencyKey());
  };

  const handleFinish = async (values: FormValues) => {
    try {
      const common = {
        kategori_id: values.kategori_id!,
        rekening_id: values.rekening_id!,
        nominal: values.nominal!,
        tanggal: values.tanggal.format('YYYY-MM-DD'),
        catatan: values.catatan?.trim() || undefined,
        idempotency_key: idKey,
      };
      if (values.tipe === 'masuk') {
        await catatMasuk.mutateAsync({ ...common, donatur_nama: values.donatur_nama?.trim() || null });
        message.success('Uang masuk dicatat');
      } else {
        const talangan = (values.talangan ?? [])
          .filter((t) => t?.penalang_nama?.trim() && Number(t?.pokok) > 0)
          .map((t) => ({ penalang_nama: t.penalang_nama!.trim(), pokok: Number(t.pokok) }));
        const res = await catatKeluar.mutateAsync({
          ...common,
          penerima_nama: butuhPenerima ? values.penerima_nama?.trim() : undefined,
          talangan: talangan.length > 0 ? talangan : undefined,
        });
        message.success(
          res.loans.length > 0
            ? `Pengeluaran dicatat dengan ${res.loans.length} talangan`
            : 'Pengeluaran dicatat',
        );
      }
      resetForm();
    } catch (err) {
      // Gagal: idKey tetap, jadi kirim ulang aman (tidak tercatat dua kali).
      message.error(normalizeError(err).message);
    }
  };

  const rekeningOptions = rekening.filter((r) => r.aktif).map((r) => ({ value: r.id, label: r.nama }));

  return (
    <Flex vertical gap={16}>
      <Card size="small" title="Catat transaksi">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ tipe: 'keluar', tanggal: dayjs(), talangan: [] }}
          onFinish={handleFinish}
          onValuesChange={(changed) => {
            if ('tipe' in changed) form.setFieldsValue({ kategori_id: undefined, talangan: [] });
          }}
        >
          <Form.Item name="tipe" label="Jenis">
            <Radio.Group
              optionType="button"
              options={[
                { value: 'keluar', label: 'Uang keluar' },
                { value: 'masuk', label: 'Uang masuk' },
              ]}
            />
          </Form.Item>

          <Flex gap={12} wrap>
            <Form.Item name="kategori_id" label="Kategori" rules={[{ required: true, message: 'Pilih kategorinya dulu ya' }]} style={{ flex: '1 1 220px' }}>
              <Select
                placeholder="Pilih kategori"
                options={kategoriAktif.map((k) => ({ value: k.id, label: k.nama }))}
                showSearch={{ optionFilterProp: 'label' }}
              />
            </Form.Item>
            <Form.Item name="rekening_id" label="Rekening" rules={[{ required: true, message: 'Pilih rekeningnya dulu ya' }]} style={{ flex: '1 1 220px' }}>
              <Select placeholder="Pilih rekening" options={rekeningOptions} />
            </Form.Item>
          </Flex>

          <Flex gap={12} wrap>
            <Form.Item name="nominal" label="Nominal" rules={[{ required: true, message: 'Nominal wajib diisi ya' }]} style={{ flex: '1 1 180px' }}>
              <InputNumber min={1} precision={0} style={{ width: '100%' }} formatter={rupiahInputFormatter} parser={rupiahInputParser} placeholder="Mis. 200.000" />
            </Form.Item>
            <Form.Item name="tanggal" label="Tanggal" rules={[{ required: true, message: 'Tanggal wajib diisi' }]} style={{ flex: '1 1 180px' }}>
              <DatePicker style={{ width: '100%' }} format="D MMM YYYY" />
            </Form.Item>
          </Flex>

          {tipe === 'masuk' ? (
            <Form.Item name="donatur_nama" label="Nama donatur (opsional)">
              <Input placeholder="Mis. Hamba Allah" maxLength={80} />
            </Form.Item>
          ) : null}

          {butuhPenerima ? (
            <Form.Item name="penerima_nama" label="Dibayarkan ke" rules={[{ required: true, message: 'Tulis nama penerimanya ya' }]}>
              <Input placeholder="Mis. Nama freelancer" maxLength={80} />
            </Form.Item>
          ) : null}

          {tipe === 'keluar' ? (
            <Card size="small" type="inner" title="Talangan (opsional)" style={{ marginBottom: 16 }}>
              <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
                Kalau kas rekening kurang, tulis siapa yang menalangi. Dana masuk nanti bisa dipakai mengembalikannya.
              </Typography.Paragraph>
              {nominal > 0 && kurang > 0 ? (
                <Alert
                  type={totalTalangan === kurang ? 'success' : 'warning'}
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={
                    totalTalangan === kurang
                      ? `Pas. Talangan ${formatRupiah(totalTalangan)} menutup kekurangan kas.`
                      : `Kas rekening ini ${formatRupiah(kasRekening)}, kurang ${formatRupiah(kurang)}. Isi talangan sampai total ${formatRupiah(kurang)}. Sekarang ${formatRupiah(totalTalangan)}.`
                  }
                />
              ) : null}
              <Form.List name="talangan">
                {(fields, { add, remove }) => (
                  <Flex vertical gap={8}>
                    {fields.map((field) => (
                      <Flex key={field.key} gap={8} wrap align="center">
                        <Form.Item name={[field.name, 'penalang_nama']} style={{ flex: '1 1 200px', marginBottom: 0 }}>
                          <Input placeholder="Nama penalang" maxLength={80} />
                        </Form.Item>
                        <Form.Item name={[field.name, 'pokok']} style={{ flex: '1 1 160px', marginBottom: 0 }}>
                          <InputNumber min={1} precision={0} style={{ width: '100%' }} formatter={rupiahInputFormatter} parser={rupiahInputParser} placeholder="Nominal talangan" />
                        </Form.Item>
                        <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} aria-label="Hapus talangan" />
                      </Flex>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ penalang_nama: '', pokok: undefined })}>
                      Tambah penalang
                    </Button>
                  </Flex>
                )}
              </Form.List>
            </Card>
          ) : null}

          <Form.Item name="catatan" label="Catatan (opsional)">
            <Input placeholder="Mis. Tagihan hosting Desember" maxLength={500} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {tipe === 'masuk' ? 'Catat uang masuk' : 'Catat uang keluar'}
            </Button>
            <Button onClick={resetForm}>Kosongkan</Button>
          </Space>
        </Form>
      </Card>

      <Table<CashTransaksi>
        rowKey="id"
        size="middle"
        loading={transaksiQ.isLoading}
        dataSource={transaksiQ.data ?? []}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ x: 760 }}
        columns={[
          { title: 'Tanggal', dataIndex: 'tanggal', key: 'tanggal', width: 130, render: (v: string) => formatDate(v) },
          {
            title: 'Jenis',
            dataIndex: 'tipe',
            key: 'tipe',
            width: 100,
            render: (v: CashTipe) => <Tag color={v === 'masuk' ? 'green' : 'red'}>{v === 'masuk' ? 'Masuk' : 'Keluar'}</Tag>,
          },
          {
            title: 'Keterangan',
            key: 'label',
            render: (_: unknown, row: CashTransaksi) => (
              <Flex vertical gap={0}>
                <span>{labelTransaksi(row, kategoriMap)}</span>
                {row.penerima_nama || row.donatur_nama || row.catatan ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.penerima_nama ? `Ke ${row.penerima_nama}` : row.donatur_nama ? `Dari ${row.donatur_nama}` : row.catatan}
                  </Typography.Text>
                ) : null}
                {row.alasan_koreksi ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Koreksi: {row.alasan_koreksi}
                  </Typography.Text>
                ) : null}
              </Flex>
            ),
          },
          {
            title: 'Nominal',
            dataIndex: 'nominal',
            key: 'nominal',
            width: 150,
            align: 'right',
            render: (v: number, row: CashTransaksi) => (
              <Typography.Text type={row.tipe === 'masuk' ? 'success' : 'danger'}>
                {row.tipe === 'masuk' ? '+' : '-'}
                {formatRupiah(v)}
              </Typography.Text>
            ),
          },
          {
            title: 'Rekening',
            dataIndex: 'rekening_id',
            key: 'rekening_id',
            width: 150,
            render: (v: string) => rekeningMap.get(v)?.nama ?? v,
          },
          {
            title: '',
            key: 'ops',
            width: 210,
            render: (_: unknown, row: CashTransaksi) => {
              const isKoreksi = row.kategori_sistem === 'reversal';
              const bisaRefund = row.tipe === 'masuk' && kategoriMap.get(row.kategori_id ?? '')?.kode === KODE_DONASI;
              return (
                <Space>
                  {bisaRefund ? (
                    <Button size="small" icon={<RetweetOutlined />} onClick={() => setRefundSource(row)}>
                      Refund
                    </Button>
                  ) : null}
                  {!isKoreksi ? (
                    <Button size="small" danger icon={<UndoOutlined />} onClick={() => setReversalTarget(row)}>
                      Koreksi
                    </Button>
                  ) : null}
                </Space>
              );
            },
          },
        ]}
      />

      {transaksiQ.isError ? <Typography.Text type="danger">{normalizeError(transaksiQ.error).message}</Typography.Text> : null}
      {reversalTarget ? <ReversalDialog target={reversalTarget} onClose={() => setReversalTarget(null)} /> : null}
      {refundSource ? (
        <RefundDialog source={refundSource} rekening={rekening} onClose={() => setRefundSource(null)} />
      ) : null}
    </Flex>
  );
}