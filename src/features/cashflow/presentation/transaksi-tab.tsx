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
  type PartyValue,
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
import { PartyPicker } from './party-picker';

const KODE_DONASI = 'MSK-DON';

const SISTEM_LABEL: Record<string, string> = {
  talangan: 'Dana ditalangi',
  reimburse: 'Pengembalian talangan',
  refund: 'Refund donasi',
  reversal: 'Koreksi',
  transfer: 'Pindah rekening',
};

type DonaturPilihan = 'anonim' | 'perorangan' | 'usaha';

interface FormValues {
  tipe: CashTipe;
  kategori_id?: string;
  rekening_id?: string;
  nominal?: number;
  tanggal: dayjs.Dayjs;
  catatan?: string;
  donatur_tipe?: DonaturPilihan;
  donatur?: PartyValue;
  penerima_nama?: string;
  talangan?: { penalang?: PartyValue; pokok?: number }[];
}

function labelTransaksi(
  row: CashTransaksi,
  kategoriMap: Map<string, KategoriTransaksi>,
  pasangan: CashTransaksi | undefined,
  namaRekening: (id: string) => string,
): string {
  if (row.kategori_sistem === 'transfer') {
    // Kedua kaki transfer menampilkan arah yang sama: dari kaki keluar ke kaki masuk.
    const keluar = row.tipe === 'keluar' ? row : pasangan;
    const masuk = row.tipe === 'masuk' ? row : pasangan;
    if (keluar && masuk) return `Pindah dari ${namaRekening(keluar.rekening_id)} ke ${namaRekening(masuk.rekening_id)}`;
    return SISTEM_LABEL.transfer;
  }
  if (row.kewajiban_id) return `Pembayaran kewajiban ${row.periode ?? ''}`.trim();
  if (row.kategori_id) return kategoriMap.get(row.kategori_id)?.nama ?? row.kategori_id;
  return SISTEM_LABEL[row.kategori_sistem ?? ''] ?? '-';
}

function donaturLabel(row: CashTransaksi): string {
  if (!row.donatur_nama) return '';
  const jenis = row.donatur_tipe === 'usaha' ? ' (usaha)' : row.donatur_user_id ? ' (akun)' : '';
  return `Dari ${row.donatur_nama}${jenis}`;
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
  const namaRekening = (id: string) => rekeningMap.get(id)?.nama ?? id;
  const transaksiRows = useMemo(() => transaksiQ.data ?? [], [transaksiQ.data]);
  const pasanganMap = useMemo(() => {
    const byPair = new Map<string, CashTransaksi>();
    for (const row of transaksiRows) {
      if (row.transfer_pair_id) byPair.set(`${row.transfer_pair_id}:${row.tipe}`, row);
    }
    const result = new Map<string, CashTransaksi>();
    for (const row of transaksiRows) {
      if (!row.transfer_pair_id) continue;
      const other = byPair.get(`${row.transfer_pair_id}:${row.tipe === 'keluar' ? 'masuk' : 'keluar'}`);
      if (other) result.set(row.id, other);
    }
    return result;
  }, [transaksiRows]);

  const tipe = Form.useWatch('tipe', form) ?? 'keluar';
  const donaturPilihan = Form.useWatch('donatur_tipe', form) ?? 'anonim';
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
        const jenis = values.donatur_tipe;
        const donatur = jenis === 'perorangan' || jenis === 'usaha' ? values.donatur : undefined;
        await catatMasuk.mutateAsync({
          ...common,
          donatur_tipe: donatur && (jenis === 'perorangan' || jenis === 'usaha') ? jenis : null,
          donatur_user_id: jenis === 'perorangan' ? (donatur?.id ?? null) : null,
          donatur_usaha_id: jenis === 'usaha' ? (donatur?.id ?? null) : null,
          donatur_nama: donatur?.nama ?? null,
        });
        message.success('Uang masuk dicatat');
      } else {
        const talangan = (values.talangan ?? [])
          .filter((t) => t?.penalang?.nama?.trim() && Number(t?.pokok) > 0)
          .map((t) => ({
            penalang_nama: t.penalang!.nama.trim(),
            penalang_user_id: t.penalang!.id,
            pokok: Number(t.pokok),
          }));
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
          initialValues={{ tipe: 'keluar', donatur_tipe: 'anonim', tanggal: dayjs(), talangan: [] }}
          onFinish={handleFinish}
          onValuesChange={(changed) => {
            if ('tipe' in changed) form.setFieldsValue({ kategori_id: undefined, talangan: [], donatur_tipe: 'anonim', donatur: undefined });
            if ('donatur_tipe' in changed) form.setFieldsValue({ donatur: undefined });
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
            <>
              <Form.Item name="donatur_tipe" label="Dari siapa (donatur atau sponsor)">
                <Radio.Group
                  optionType="button"
                  options={[
                    { value: 'anonim', label: 'Tanpa nama' },
                    { value: 'perorangan', label: 'Perorangan' },
                    { value: 'usaha', label: 'Usaha' },
                  ]}
                />
              </Form.Item>
              {donaturPilihan === 'perorangan' ? (
                <Form.Item
                  name="donatur"
                  label="Akun atau nama donatur"
                  extra="Pilih akun Sambasku, atau ketik nama kalau donaturnya belum punya akun."
                  rules={[{ required: true, message: 'Pilih akun atau tulis namanya dulu ya' }]}
                >
                  <PartyPicker kind="user" allowFreeText placeholder="Cari akun atau ketik nama" />
                </Form.Item>
              ) : null}
              {donaturPilihan === 'usaha' ? (
                <Form.Item
                  name="donatur"
                  label="Usaha"
                  extra="Sponsor terhubung ke data usaha yang sudah terdaftar."
                  rules={[{ required: true, message: 'Pilih usahanya dulu ya' }]}
                >
                  <PartyPicker kind="usaha" placeholder="Cari nama usaha" />
                </Form.Item>
              ) : null}
            </>
          ) : null}

          {butuhPenerima ? (
            <Form.Item name="penerima_nama" label="Dibayarkan ke" rules={[{ required: true, message: 'Tulis nama penerimanya ya' }]}>
              <Input placeholder="Mis. Nama freelancer" maxLength={80} />
            </Form.Item>
          ) : null}

          {tipe === 'keluar' ? (
            <Card size="small" type="inner" title="Talangan (opsional)" style={{ marginBottom: 16 }}>
              <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
                Kalau kas rekening kurang, pilih siapa yang menalangi. Dana masuk nanti bisa dipakai mengembalikannya.
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
                        <Form.Item name={[field.name, 'penalang']} style={{ flex: '1 1 240px', marginBottom: 0 }}>
                          <PartyPicker kind="user" allowFreeText placeholder="Cari akun atau ketik nama penalang" />
                        </Form.Item>
                        <Form.Item name={[field.name, 'pokok']} style={{ flex: '1 1 160px', marginBottom: 0 }}>
                          <InputNumber min={1} precision={0} style={{ width: '100%' }} formatter={rupiahInputFormatter} parser={rupiahInputParser} placeholder="Nominal talangan" />
                        </Form.Item>
                        <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} aria-label="Hapus talangan" />
                      </Flex>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ penalang: undefined, pokok: undefined })}>
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
        dataSource={transaksiRows}
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
                <span>{labelTransaksi(row, kategoriMap, pasanganMap.get(row.id), namaRekening)}</span>
                {row.penerima_nama || row.donatur_nama || row.catatan ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.penerima_nama ? `Ke ${row.penerima_nama}` : row.donatur_nama ? donaturLabel(row) : row.catatan}
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
