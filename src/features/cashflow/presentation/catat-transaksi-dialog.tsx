import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { App as AntdApp, Alert, Button, Card, DatePicker, Flex, Form, Input, InputNumber, Modal, Radio, Select, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { newIdempotencyKey } from '../infrastructure/cashflow-api';
import {
  KODE_KATEGORI_JASA,
  formatRupiah,
  rupiahInputFormatter,
  rupiahInputParser,
  type PartyValue,
} from '../domain/cashflow';
import {
  useCashflowKategori,
  useCashflowRekening,
  useCashflowSummary,
  useCatatKeluar,
  useCatatMasuk,
} from '../application/use-cashflow';
import { PartyPicker } from './party-picker';

/** `talangan` = uang keluar dengan bagian penalang sudah terbuka. Server tetap menerima satu endpoint keluar. */
export type CatatMode = 'masuk' | 'keluar' | 'talangan';

type DonaturPilihan = 'anonim' | 'perorangan' | 'usaha';

interface FormValues {
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

const JUDUL: Record<CatatMode, string> = {
  masuk: 'Catat uang masuk',
  keluar: 'Catat uang keluar',
  talangan: 'Catat uang keluar dengan talangan',
};

interface CatatTransaksiDialogProps {
  mode: CatatMode;
  onClose: () => void;
}

/** Form catat uang masuk atau keluar. Dimount saat dibuka, jadi kunci idempotensi baru tiap pembukaan. */
export function CatatTransaksiDialog({ mode, onClose }: CatatTransaksiDialogProps) {
  const { message } = AntdApp.useApp();
  const summary = useCashflowSummary();
  const kategoriQ = useCashflowKategori();
  const rekeningQ = useCashflowRekening();
  const catatMasuk = useCatatMasuk();
  const catatKeluar = useCatatKeluar();

  const [form] = Form.useForm<FormValues>();
  // Gagal kirim: kunci tetap, jadi kirim ulang aman (tidak tercatat dua kali).
  const [idKey] = useState(newIdempotencyKey);

  const tipe = mode === 'masuk' ? 'masuk' : 'keluar';
  const kategori = useMemo(() => kategoriQ.data ?? [], [kategoriQ.data]);
  const rekening = useMemo(() => rekeningQ.data ?? [], [rekeningQ.data]);

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
  const rekeningOptions = rekening.filter((r) => r.aktif).map((r) => ({ value: r.id, label: r.nama }));

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
      if (tipe === 'masuk') {
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
          res.loans.length > 0 ? `Pengeluaran dicatat dengan ${res.loans.length} talangan` : 'Pengeluaran dicatat',
        );
      }
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title={JUDUL[mode]}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={tipe === 'masuk' ? 'Catat uang masuk' : 'Catat uang keluar'}
      cancelText="Batal"
      confirmLoading={saving}
      maskClosable={!saving}
      destroyOnHidden
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          donatur_tipe: 'anonim',
          tanggal: dayjs(),
          talangan: mode === 'talangan' ? [{ penalang: undefined, pokok: undefined }] : [],
        }}
        onFinish={handleFinish}
        onValuesChange={(changed) => {
          if ('donatur_tipe' in changed) form.setFieldsValue({ donatur: undefined });
        }}
      >
        <Flex gap={12} wrap>
          <Form.Item
            name="kategori_id"
            label="Kategori"
            rules={[{ required: true, message: 'Pilih kategorinya dulu ya' }]}
            style={{ flex: '1 1 220px' }}
          >
            <Select
              placeholder="Pilih kategori"
              options={kategoriAktif.map((k) => ({ value: k.id, label: k.nama }))}
              showSearch={{ optionFilterProp: 'label' }}
            />
          </Form.Item>
          <Form.Item
            name="rekening_id"
            label="Rekening"
            rules={[{ required: true, message: 'Pilih rekeningnya dulu ya' }]}
            style={{ flex: '1 1 220px' }}
          >
            <Select placeholder="Pilih rekening" options={rekeningOptions} />
          </Form.Item>
        </Flex>

        <Flex gap={12} wrap>
          <Form.Item
            name="nominal"
            label="Nominal"
            rules={[{ required: true, message: 'Nominal wajib diisi ya' }]}
            style={{ flex: '1 1 180px' }}
          >
            <InputNumber
              min={1}
              precision={0}
              style={{ width: '100%' }}
              formatter={rupiahInputFormatter}
              parser={rupiahInputParser}
              placeholder="Mis. 200.000"
            />
          </Form.Item>
          <Form.Item
            name="tanggal"
            label="Tanggal"
            rules={[{ required: true, message: 'Tanggal wajib diisi' }]}
            style={{ flex: '1 1 180px' }}
          >
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
          <Form.Item
            name="penerima_nama"
            label="Dibayarkan ke"
            rules={[{ required: true, message: 'Tulis nama penerimanya ya' }]}
          >
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
                title={
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
                        <InputNumber
                          min={1}
                          precision={0}
                          style={{ width: '100%' }}
                          formatter={rupiahInputFormatter}
                          parser={rupiahInputParser}
                          placeholder="Nominal talangan"
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                        aria-label="Hapus talangan"
                      />
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

        <Form.Item name="catatan" label="Catatan (opsional)" style={{ marginBottom: 0 }}>
          <Input placeholder="Mis. Tagihan hosting Desember" maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
