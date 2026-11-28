import { useMemo, useState } from 'react';
import { Alert, Button, Card, Divider, Empty, Flex, Skeleton, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, RollbackOutlined } from '@ant-design/icons';
import { normalizeError } from '@/shared/api/error';
import { formatDate } from '@/shared/utils/format-datetime';
import { REKENING_JENIS_LABEL, formatRupiah, type Loan, type PengingatItem, type Rekening } from '../domain/cashflow';
import {
  useCashflowLoans,
  useCashflowPengingat,
  useCashflowRekening,
  useCashflowSummary,
} from '../application/use-cashflow';
import { BayarKewajibanDialog, ReimburseDialog } from './cashflow-dialogs';

export type RingkasanTujuan = 'kewajiban' | 'talangan' | 'pengaturan';

/** Jumlah baris "Perlu perhatian" yang tampil di ringkasan. Sisanya lewat tab masing-masing. */
const BATAS_PERHATIAN = 8;

type Perhatian =
  | { kind: 'kewajiban'; key: string; terlewat: boolean; urut: string; item: PengingatItem }
  | { kind: 'talangan'; key: string; terlewat: false; urut: string; loan: Loan };

interface RingkasanTabProps {
  onGoTo: (tujuan: RingkasanTujuan) => void;
}

/** Halaman awal Keuangan: saldo tiap rekening dan semua yang perlu ditindak (kewajiban dan talangan). */
export function RingkasanTab({ onGoTo }: RingkasanTabProps) {
  const summaryQ = useCashflowSummary();
  const pengingatQ = useCashflowPengingat();
  const loansQ = useCashflowLoans();
  const rekeningQ = useCashflowRekening();

  const [bayarTarget, setBayarTarget] = useState<PengingatItem | null>(null);
  const [reimburseTarget, setReimburseTarget] = useState<Loan | null>(null);

  const rekening: Rekening[] = useMemo(() => rekeningQ.data ?? [], [rekeningQ.data]);
  const saldoRekening = summaryQ.data?.rekening ?? [];

  const perhatian = useMemo<Perhatian[]>(() => {
    const kewajiban: Perhatian[] = (pengingatQ.data ?? [])
      .filter((p) => p.status !== 'lunas')
      .map((item) => ({
        kind: 'kewajiban' as const,
        key: `k|${item.kewajiban_id}|${item.periode}`,
        terlewat: item.terlewat,
        urut: item.due_date,
        item,
      }));
    kewajiban.sort((a, b) => Number(b.terlewat) - Number(a.terlewat) || a.urut.localeCompare(b.urut));
    const talangan: Perhatian[] = (loansQ.data ?? [])
      .filter((l) => l.status === 'outstanding')
      .map((loan) => ({
        kind: 'talangan' as const,
        key: `t|${loan.id}`,
        terlewat: false as const,
        urut: loan.tanggal_talangan,
        loan,
      }));
    talangan.sort((a, b) => a.urut.localeCompare(b.urut));
    return [...kewajiban, ...talangan];
  }, [pengingatQ.data, loansQ.data]);

  const tampil = perhatian.slice(0, BATAS_PERHATIAN);
  const sisaTersembunyi = perhatian.length - tampil.length;
  const memuatPerhatian = pengingatQ.isLoading || loansQ.isLoading;

  return (
    <Flex vertical gap={24}>
      <section>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Saldo per rekening
        </Typography.Title>
        {summaryQ.isLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : saldoRekening.length === 0 ? (
          <Empty description="Belum ada rekening.">
            <Button type="primary" onClick={() => onGoTo('pengaturan')}>
              Buat rekening
            </Button>
          </Empty>
        ) : (
          <Flex gap={12} wrap>
            {saldoRekening.map((r) => (
              <Card key={r.id} size="small" style={{ flex: '1 1 200px', maxWidth: 320 }}>
                <Flex justify="space-between" align="center" gap={8}>
                  <Typography.Text strong>{r.nama}</Typography.Text>
                  <Tag style={{ marginInlineEnd: 0 }}>{REKENING_JENIS_LABEL[r.jenis]}</Tag>
                </Flex>
                <Typography.Title level={4} type={r.saldo < 0 ? 'danger' : undefined} style={{ margin: '8px 0 0' }}>
                  {formatRupiah(r.saldo)}
                </Typography.Title>
              </Card>
            ))}
          </Flex>
        )}
        {summaryQ.isError ? <Typography.Text type="danger">{normalizeError(summaryQ.error).message}</Typography.Text> : null}
      </section>

      <section>
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 8 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Perlu perhatian{perhatian.length > 0 ? ` (${perhatian.length})` : ''}
          </Typography.Title>
          <Space size={4} wrap>
            <Button type="link" size="small" onClick={() => onGoTo('kewajiban')}>
              Semua kewajiban
            </Button>
            <Button type="link" size="small" onClick={() => onGoTo('talangan')}>
              Semua talangan
            </Button>
          </Space>
        </Flex>

        {memuatPerhatian ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : perhatian.length === 0 ? (
          <Alert
            type="success"
            showIcon
            title="Semua beres. Tidak ada kewajiban yang jatuh tempo dan tidak ada talangan yang belum kembali."
          />
        ) : (
          <Card size="small" styles={{ body: { padding: 0 } }}>
            {tampil.map((p, i) => (
              <div key={p.key}>
                {i > 0 ? <Divider style={{ margin: 0 }} /> : null}
                <Flex gap={12} align="center" wrap style={{ padding: '10px 16px' }}>
                  {p.kind === 'kewajiban' ? (
                    <>
                      <Tag color={p.terlewat ? 'red' : 'orange'} style={{ marginInlineEnd: 0, minWidth: 72, textAlign: 'center' }}>
                        {p.terlewat ? 'Terlewat' : 'Kewajiban'}
                      </Tag>
                      <Flex vertical style={{ flex: '1 1 240px', minWidth: 0 }}>
                        <span>
                          {p.item.nama} - {p.item.periode}
                        </span>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          Jatuh tempo {formatDate(p.item.due_date)}
                        </Typography.Text>
                      </Flex>
                      <Typography.Text strong style={{ minWidth: 130, textAlign: 'right' }}>
                        {formatRupiah(p.item.sisa > 0 ? p.item.sisa : p.item.nominal_estimasi)}
                      </Typography.Text>
                      <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => setBayarTarget(p.item)}>
                        Bayar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Tag color="blue" style={{ marginInlineEnd: 0, minWidth: 72, textAlign: 'center' }}>
                        Talangan
                      </Tag>
                      <Flex vertical style={{ flex: '1 1 240px', minWidth: 0 }}>
                        <span>{p.loan.penalang_nama} belum dikembalikan</span>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          Ditalangi {formatDate(p.loan.tanggal_talangan)}
                        </Typography.Text>
                      </Flex>
                      <Typography.Text strong style={{ minWidth: 130, textAlign: 'right' }}>
                        {formatRupiah(p.loan.sisa)}
                      </Typography.Text>
                      <Button size="small" type="primary" icon={<RollbackOutlined />} onClick={() => setReimburseTarget(p.loan)}>
                        Kembalikan
                      </Button>
                    </>
                  )}
                </Flex>
              </div>
            ))}
            {sisaTersembunyi > 0 ? (
              <>
                <Divider style={{ margin: 0 }} />
                <Typography.Text type="secondary" style={{ display: 'block', padding: '8px 16px' }}>
                  Dan {sisaTersembunyi} lainnya. Buka tab Kewajiban atau Talangan untuk melihat semuanya.
                </Typography.Text>
              </>
            ) : null}
          </Card>
        )}
        {pengingatQ.isError ? <Typography.Text type="danger">{normalizeError(pengingatQ.error).message}</Typography.Text> : null}
        {loansQ.isError ? <Typography.Text type="danger">{normalizeError(loansQ.error).message}</Typography.Text> : null}
      </section>

      {bayarTarget ? (
        <BayarKewajibanDialog item={bayarTarget} rekening={rekening} onClose={() => setBayarTarget(null)} />
      ) : null}
      {reimburseTarget ? (
        <ReimburseDialog loan={reimburseTarget} rekening={rekening} onClose={() => setReimburseTarget(null)} />
      ) : null}
    </Flex>
  );
}
