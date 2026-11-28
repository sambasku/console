import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Card, Divider, Empty, Flex, Skeleton, Space, Tag, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PaperClipOutlined,
  RetweetOutlined,
  SwapOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { formatDate } from '@/shared/utils/format-datetime';
import { formatRupiah, type CashTransaksi, type KategoriTransaksi } from '../domain/cashflow';
import { useCashflowKategori, useCashflowRekening, useCashflowTransaksi } from '../application/use-cashflow';
import { RefundDialog, ReversalDialog } from './cashflow-dialogs';
import { LampiranDialog } from './lampiran-dialog';

const KODE_DONASI = 'MSK-DON';

/** Batas baris yang diminta ke API (lihat `listTransaksiRequest`). Dipakai untuk catatan "terbaru saja". */
const BATAS_TAMPIL = 100;

const SISTEM_LABEL: Record<string, string> = {
  talangan: 'Dana ditalangi',
  reimburse: 'Pengembalian talangan',
  refund: 'Refund donasi',
  reversal: 'Koreksi',
  transfer: 'Pindah rekening',
};

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

function labelHari(tanggal: string): string {
  const d = dayjs(tanggal);
  if (d.isSame(dayjs(), 'day')) return `Hari ini - ${formatDate(tanggal)}`;
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return `Kemarin - ${formatDate(tanggal)}`;
  return formatDate(tanggal);
}

interface HariGroup {
  tanggal: string;
  rows: CashTransaksi[];
  masuk: number;
  keluar: number;
}

/** Riwayat transaksi sebagai timeline per hari. Pindah rekening tidak dihitung ke total harian (netral). */
export function TransaksiTab() {
  const kategoriQ = useCashflowKategori();
  const rekeningQ = useCashflowRekening();
  const transaksiQ = useCashflowTransaksi();

  const [reversalTarget, setReversalTarget] = useState<CashTransaksi | null>(null);
  const [refundSource, setRefundSource] = useState<CashTransaksi | null>(null);
  const [lampiranTarget, setLampiranTarget] = useState<CashTransaksi | null>(null);

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

  const groups = useMemo<HariGroup[]>(() => {
    const byDay = new Map<string, HariGroup>();
    for (const row of transaksiRows) {
      // Satu pindah rekening = satu baris: sembunyikan kaki masuk bila kaki keluarnya ikut termuat.
      if (row.transfer_pair_id && row.tipe === 'masuk' && pasanganMap.has(row.id)) continue;
      let g = byDay.get(row.tanggal);
      if (!g) {
        g = { tanggal: row.tanggal, rows: [], masuk: 0, keluar: 0 };
        byDay.set(row.tanggal, g);
      }
      g.rows.push(row);
      if (row.kategori_sistem !== 'transfer') {
        if (row.tipe === 'masuk') g.masuk += row.nominal;
        else g.keluar += row.nominal;
      }
    }
    const hasil = [...byDay.values()].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    for (const g of hasil) g.rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return hasil;
  }, [transaksiRows, pasanganMap]);

  if (transaksiQ.isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <Flex vertical gap={16}>
      {groups.length === 0 ? (
        <Empty description="Belum ada transaksi. Klik Catat di kanan atas untuk mulai." />
      ) : null}

      {groups.map((g) => (
        <Card
          key={g.tanggal}
          size="small"
          title={labelHari(g.tanggal)}
          extra={
            <Space size={12} wrap>
              {g.masuk > 0 ? <Typography.Text type="success">Masuk +{formatRupiah(g.masuk)}</Typography.Text> : null}
              {g.keluar > 0 ? <Typography.Text type="danger">Keluar -{formatRupiah(g.keluar)}</Typography.Text> : null}
            </Space>
          }
          styles={{ body: { padding: 0 } }}
        >
          {g.rows.map((row, i) => {
            const isTransfer = row.kategori_sistem === 'transfer';
            const isKoreksi = row.kategori_sistem === 'reversal';
            const bisaRefund = row.tipe === 'masuk' && kategoriMap.get(row.kategori_id ?? '')?.kode === KODE_DONASI;
            const detail = row.penerima_nama
              ? `Ke ${row.penerima_nama}`
              : row.donatur_nama
                ? donaturLabel(row)
                : row.catatan;
            const Ikon = isTransfer ? SwapOutlined : row.tipe === 'masuk' ? ArrowDownOutlined : ArrowUpOutlined;
            const warnaIkon = isTransfer ? 'secondary' : row.tipe === 'masuk' ? 'success' : 'danger';
            return (
              <div key={row.id}>
                {i > 0 ? <Divider style={{ margin: 0 }} /> : null}
                <Flex gap={12} align="center" wrap style={{ padding: '10px 16px' }}>
                  <Typography.Text type={warnaIkon} style={{ fontSize: 18 }}>
                    <Ikon />
                  </Typography.Text>
                  <Flex vertical style={{ flex: '1 1 260px', minWidth: 0 }}>
                    <span>{labelTransaksi(row, kategoriMap, pasanganMap.get(row.id), namaRekening)}</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {isTransfer ? detail : `${namaRekening(row.rekening_id)}${detail ? ` - ${detail}` : ''}`}
                    </Typography.Text>
                    {row.alasan_koreksi ? (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Koreksi: {row.alasan_koreksi}
                      </Typography.Text>
                    ) : null}
                  </Flex>
                  {row.lampiran_count ? (
                    <Tag
                      color="blue"
                      icon={<PaperClipOutlined />}
                      style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                      onClick={() => setLampiranTarget(row)}
                    >
                      {row.lampiran_count}
                    </Tag>
                  ) : null}
                  <Typography.Text
                    strong
                    type={isTransfer ? undefined : row.tipe === 'masuk' ? 'success' : 'danger'}
                    style={{ minWidth: 130, textAlign: 'right' }}
                  >
                    {isTransfer ? '' : row.tipe === 'masuk' ? '+' : '-'}
                    {formatRupiah(row.nominal)}
                  </Typography.Text>
                  <Space size={4}>
                    <Button size="small" icon={<PaperClipOutlined />} onClick={() => setLampiranTarget(row)}>
                      Bukti
                    </Button>
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
                </Flex>
              </div>
            );
          })}
        </Card>
      ))}

      {transaksiRows.length >= BATAS_TAMPIL ? (
        <Typography.Text type="secondary">Menampilkan {BATAS_TAMPIL} transaksi terbaru.</Typography.Text>
      ) : null}
      {transaksiQ.isError ? <Typography.Text type="danger">{normalizeError(transaksiQ.error).message}</Typography.Text> : null}
      {reversalTarget ? <ReversalDialog target={reversalTarget} onClose={() => setReversalTarget(null)} /> : null}
      {lampiranTarget ? <LampiranDialog tx={lampiranTarget} onClose={() => setLampiranTarget(null)} /> : null}
      {refundSource ? (
        <RefundDialog source={refundSource} rekening={rekening} onClose={() => setRefundSource(null)} />
      ) : null}
    </Flex>
  );
}
