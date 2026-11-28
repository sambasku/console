import { useMemo, useState } from 'react';
import { App as AntdApp, Button, Flex, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { formatDate } from '@/shared/utils/format-datetime';
import {
  PERIODE_STATUS_LABEL,
  RECURRENCE_LABEL,
  formatRupiah,
  type Kewajiban,
  type PengingatItem,
  type PeriodeStatus,
  type Rekening,
} from '../domain/cashflow';
import {
  useCashflowKategori,
  useCashflowKewajiban,
  useCashflowPengingat,
  useCashflowRekening,
  useUpdateKewajiban,
} from '../application/use-cashflow';
import { BayarKewajibanDialog, BerhentiDialog, KewajibanDialog } from './cashflow-dialogs';

const STATUS_COLOR: Record<PeriodeStatus, string> = {
  belum: 'default',
  sebagian: 'gold',
  lunas: 'green',
};

/** Tab pengingat: beban yang harus dibayar (bulanan, tahunan, sekali) dan jadwal berikutnya. */
export function PengingatTab() {
  const { message } = AntdApp.useApp();
  const pengingatQ = useCashflowPengingat();
  const kewajibanQ = useCashflowKewajiban();
  const kategoriQ = useCashflowKategori();
  const rekeningQ = useCashflowRekening();
  const updateKewajiban = useUpdateKewajiban();

  const [bayarTarget, setBayarTarget] = useState<PengingatItem | null>(null);
  const [berhentiTarget, setBerhentiTarget] = useState<Kewajiban | null>(null);
  const [kewajibanBaru, setKewajibanBaru] = useState(false);

  const pengingat = useMemo(() => pengingatQ.data ?? [], [pengingatQ.data]);
  const kewajiban = useMemo(() => kewajibanQ.data ?? [], [kewajibanQ.data]);
  const kategori = useMemo(() => kategoriQ.data ?? [], [kategoriQ.data]);
  const rekening: Rekening[] = useMemo(() => rekeningQ.data ?? [], [rekeningQ.data]);

  const handleAktifkan = async (row: Kewajiban) => {
    try {
      await updateKewajiban.mutateAsync({ id: row.id, aktif: true });
      message.success(`${row.nama} diaktifkan lagi`);
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Flex vertical gap={24}>
      <section>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Perlu dibayar
        </Typography.Title>
        <Table<PengingatItem>
          rowKey={(row) => `${row.kewajiban_id}|${row.periode}`}
          loading={pengingatQ.isLoading}
          dataSource={pengingat}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'Tidak ada yang perlu dibayar. Semua periode sudah lunas.' }}
          columns={[
            {
              title: 'Jatuh tempo',
              dataIndex: 'due_date',
              key: 'due_date',
              width: 130,
              render: (v: string, row: PengingatItem) => (
                <Space size={4}>
                  {formatDate(v)}
                  {row.terlewat ? <Tag color="red">Terlewat</Tag> : null}
                </Space>
              ),
            },
            { title: 'Kewajiban', dataIndex: 'nama', key: 'nama' },
            { title: 'Periode', dataIndex: 'periode', key: 'periode', width: 110 },
            { title: 'Perkiraan', dataIndex: 'nominal_estimasi', key: 'nominal_estimasi', width: 140, align: 'right', render: (v: number) => formatRupiah(v) },
            { title: 'Sudah dibayar', dataIndex: 'paid', key: 'paid', width: 140, align: 'right', render: (v: number) => formatRupiah(v) },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              width: 140,
              render: (v: PeriodeStatus) => <Tag color={STATUS_COLOR[v]}>{PERIODE_STATUS_LABEL[v]}</Tag>,
            },
            {
              title: '',
              key: 'ops',
              width: 130,
              render: (_: unknown, row: PengingatItem) => (
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => setBayarTarget(row)}>
                  Bayar
                </Button>
              ),
            },
          ]}
        />
      </section>

      <section>
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 8 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Daftar kewajiban
          </Typography.Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setKewajibanBaru(true)}>
            Pengingat baru
          </Button>
        </Flex>
        <Table<Kewajiban>
          rowKey="id"
          loading={kewajibanQ.isLoading}
          dataSource={kewajiban}
          pagination={false}
          scroll={{ x: 800 }}
          columns={[
            { title: 'Nama', dataIndex: 'nama', key: 'nama' },
            { title: 'Perkiraan', dataIndex: 'nominal_estimasi', key: 'nominal_estimasi', width: 140, align: 'right', render: (v: number) => formatRupiah(v) },
            { title: 'Pengulangan', dataIndex: 'recurrence', key: 'recurrence', width: 120, render: (v: Kewajiban['recurrence']) => RECURRENCE_LABEL[v] },
            { title: 'Mulai', dataIndex: 'periode_mulai', key: 'periode_mulai', width: 110 },
            { title: 'Tgl jatuh tempo', dataIndex: 'hari_jatuh_tempo', key: 'hari_jatuh_tempo', width: 130, align: 'right' },
            {
              title: 'Status',
              key: 'aktif',
              width: 170,
              render: (_: unknown, row: Kewajiban) =>
                row.aktif ? (
                  <Tag color="green">Aktif</Tag>
                ) : (
                  <Tag>{row.berhenti_per ? `Berhenti ${formatDate(row.berhenti_per)}` : 'Nonaktif'}</Tag>
                ),
            },
            {
              title: '',
              key: 'ops',
              width: 180,
              render: (_: unknown, row: Kewajiban) =>
                row.aktif ? (
                  <Button size="small" danger icon={<StopOutlined />} onClick={() => setBerhentiTarget(row)}>
                    Berhentikan
                  </Button>
                ) : (
                  <Popconfirm
                    title="Aktifkan lagi?"
                    description="Jadwal mulai lagi dari bulan ini."
                    okText="Aktifkan"
                    onConfirm={() => handleAktifkan(row)}
                  >
                    <Button size="small">Aktifkan lagi</Button>
                  </Popconfirm>
                ),
            },
          ]}
        />
      </section>

      {bayarTarget ? (
        <BayarKewajibanDialog item={bayarTarget} rekening={rekening} onClose={() => setBayarTarget(null)} />
      ) : null}
      {berhentiTarget ? (
        <BerhentiDialog item={berhentiTarget} onClose={() => setBerhentiTarget(null)} />
      ) : null}
      {kewajibanBaru ? <KewajibanDialog kategori={kategori} onClose={() => setKewajibanBaru(false)} /> : null}
    </Flex>
  );
}
