import { useMemo, useState } from 'react';
import { App as AntdApp, Button, Flex, Space, Switch, Table, Tag, Typography } from 'antd';
import { PlusOutlined, SwapOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import {
  REKENING_JENIS_LABEL,
  formatRupiah,
  type CashTipe,
  type KategoriTransaksi,
  type Rekening,
} from '../domain/cashflow';
import {
  useCashflowKategori,
  useCashflowRekening,
  useCashflowSummary,
  useUpdateKategori,
  useUpdateRekening,
} from '../application/use-cashflow';
import { KategoriDialog, RekeningDialog, RekonsiliasiDialog, TransferDialog } from './cashflow-dialogs';

type DialogKind = 'kategori' | 'rekening' | 'transfer' | 'rekonsiliasi' | null;

/** Tab pengaturan: master kategori (masuk/keluar), rekening, pindah dana, dan rekonsiliasi bank. */
export function PengaturanTab() {
  const { message } = AntdApp.useApp();
  const kategoriQ = useCashflowKategori();
  const rekeningQ = useCashflowRekening();
  const summaryQ = useCashflowSummary();
  const updateKategori = useUpdateKategori();
  const updateRekening = useUpdateRekening();
  const [dialog, setDialog] = useState<DialogKind>(null);

  const kategori = useMemo(() => kategoriQ.data ?? [], [kategoriQ.data]);
  const rekening: Rekening[] = useMemo(() => rekeningQ.data ?? [], [rekeningQ.data]);
  const saldoMap = new Map((summaryQ.data?.rekening ?? []).map((r) => [r.id, r.saldo]));

  const toggleKategori = async (row: KategoriTransaksi, aktif: boolean) => {
    try {
      await updateKategori.mutateAsync({ id: row.id, aktif });
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const toggleRekening = async (row: Rekening, aktif: boolean) => {
    try {
      await updateRekening.mutateAsync({ id: row.id, aktif });
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Flex vertical gap={24}>
      <Space wrap>
        <Button icon={<SwapOutlined />} onClick={() => setDialog('transfer')} disabled={rekening.length < 2}>
          Pindah dana antar rekening
        </Button>
        <Button icon={<CheckSquareOutlined />} onClick={() => setDialog('rekonsiliasi')} disabled={rekening.length === 0}>
          Cocokkan saldo bank
        </Button>
      </Space>

      <section>
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 8 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Rekening
          </Typography.Title>
          <Button icon={<PlusOutlined />} onClick={() => setDialog('rekening')}>
            Rekening baru
          </Button>
        </Flex>
        <Table<Rekening>
          rowKey="id"
          loading={rekeningQ.isLoading}
          dataSource={rekening}
          pagination={false}
          scroll={{ x: 560 }}
          columns={[
            { title: 'Nama', dataIndex: 'nama', key: 'nama' },
            { title: 'Jenis', dataIndex: 'jenis', key: 'jenis', width: 150, render: (v: Rekening['jenis']) => REKENING_JENIS_LABEL[v] },
            {
              title: 'Saldo',
              key: 'saldo',
              width: 160,
              align: 'right',
              render: (_: unknown, row: Rekening) => formatRupiah(saldoMap.get(row.id) ?? row.saldo_awal),
            },
            {
              title: 'Aktif',
              key: 'aktif',
              width: 110,
              render: (_: unknown, row: Rekening) => (
                <Switch checked={row.aktif} onChange={(v) => toggleRekening(row, v)} aria-label={`Aktifkan ${row.nama}`} />
              ),
            },
          ]}
        />
      </section>

      <section>
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 8 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Kategori
          </Typography.Title>
          <Button icon={<PlusOutlined />} onClick={() => setDialog('kategori')}>
            Kategori baru
          </Button>
        </Flex>
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Cukup kategori masuk dan keluar. Tidak ada bagan akun (COA).
        </Typography.Paragraph>
        <Table<KategoriTransaksi>
          rowKey="id"
          loading={kategoriQ.isLoading}
          dataSource={kategori}
          pagination={false}
          scroll={{ x: 560 }}
          columns={[
            { title: 'Kode', dataIndex: 'kode', key: 'kode', width: 140 },
            { title: 'Nama', dataIndex: 'nama', key: 'nama' },
            {
              title: 'Jenis',
              dataIndex: 'tipe',
              key: 'tipe',
              width: 130,
              render: (v: CashTipe) => <Tag color={v === 'masuk' ? 'green' : 'red'}>{v === 'masuk' ? 'Masuk' : 'Keluar'}</Tag>,
            },
            {
              title: 'Aktif',
              key: 'aktif',
              width: 110,
              render: (_: unknown, row: KategoriTransaksi) => (
                <Switch checked={row.aktif} onChange={(v) => toggleKategori(row, v)} aria-label={`Aktifkan ${row.nama}`} />
              ),
            },
          ]}
        />
      </section>

      {dialog === 'kategori' ? <KategoriDialog onClose={() => setDialog(null)} /> : null}
      {dialog === 'rekening' ? <RekeningDialog onClose={() => setDialog(null)} /> : null}
      {dialog === 'transfer' ? <TransferDialog rekening={rekening} onClose={() => setDialog(null)} /> : null}
      {dialog === 'rekonsiliasi' ? <RekonsiliasiDialog rekening={rekening} onClose={() => setDialog(null)} /> : null}
    </Flex>
  );
}
