import { useState } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined, PlusOutlined, ReloadOutlined, SwapOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Flex, Statistic, Tabs, Typography } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { formatRupiah } from '../domain/cashflow';
import { useCashflowRekening, useCashflowSummary } from '../application/use-cashflow';
import { CatatTransaksiDialog, type CatatMode } from './catat-transaksi-dialog';
import { TransferDialog } from './cashflow-dialogs';
import { RingkasanTab, type RingkasanTujuan } from './ringkasan-tab';
import { TransaksiTab } from './transaksi-tab';
import { TalanganTab } from './talangan-tab';
import { PengingatTab } from './pengingat-tab';
import { PengaturanTab } from './pengaturan-tab';

const formatStat = (value: string | number | undefined) => formatRupiah(Number(value ?? 0));

type TabKey = 'ringkasan' | 'transaksi' | RingkasanTujuan;
type CatatPilihan = CatatMode | 'transfer';

/**
 * Keuangan: uang masuk, uang keluar, talangan, dan kewajiban.
 * Hanya level admin ke atas. Pembatasan sebenarnya ada di middleware API; pengecekan di sini hanya UI.
 */
export function CashflowPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const summary = useCashflowSummary(canManage);
  const rekeningQ = useCashflowRekening(canManage);
  const [tab, setTab] = useState<TabKey>('ringkasan');
  const [catat, setCatat] = useState<CatatPilihan | null>(null);

  if (!canManage) {
    return <Typography.Text type="secondary">Hanya admin yang bisa melihat dan mengatur Keuangan.</Typography.Text>;
  }

  const data = summary.data;
  const rekening = rekeningQ.data ?? [];
  const butuhRekening = rekening.filter((r) => r.aktif).length === 0;

  return (
    <>
      <PageHeader
        title="Keuangan"
        subtitle="Uang masuk, uang keluar, talangan, dan kewajiban"
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => summary.refetch()}>
              Muat ulang
            </Button>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'masuk', icon: <ArrowDownOutlined />, label: 'Uang masuk', disabled: butuhRekening },
                  { key: 'keluar', icon: <ArrowUpOutlined />, label: 'Uang keluar', disabled: butuhRekening },
                  { key: 'talangan', icon: <TeamOutlined />, label: 'Uang keluar, ada yang menalangi', disabled: butuhRekening },
                  { type: 'divider' },
                  { key: 'transfer', icon: <SwapOutlined />, label: 'Pindah antar rekening', disabled: rekening.length < 2 },
                ],
                onClick: ({ key }) => setCatat(key as CatatPilihan),
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Catat
              </Button>
            </Dropdown>
          </>
        }
      />

      {summary.isError ? (
        <Typography.Text type="danger">{normalizeError(summary.error).message}</Typography.Text>
      ) : null}

      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Card size="small" style={{ flex: '1 1 200px' }}>
          <Statistic title="Kas fisik" value={data?.kas_fisik ?? 0} formatter={formatStat} loading={summary.isLoading} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Total semua rekening
          </Typography.Text>
        </Card>
        <Card size="small" style={{ flex: '1 1 200px' }}>
          <Statistic title="Talangan belum kembali" value={data?.sisa_talangan ?? 0} formatter={formatStat} loading={summary.isLoading} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Harus dikembalikan dari dana masuk
          </Typography.Text>
        </Card>
        <Card size="small" style={{ flex: '1 1 200px' }}>
          <Statistic
            title="Saldo bersih"
            value={data?.saldo_bersih ?? 0}
            formatter={formatStat}
            loading={summary.isLoading}
            styles={{ content: { color: (data?.saldo_bersih ?? 0) < 0 ? '#cf1322' : undefined } }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kas fisik dikurangi talangan. Boleh minus.
          </Typography.Text>
        </Card>
      </Flex>

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as TabKey)}
        items={[
          { key: 'ringkasan', label: 'Ringkasan', children: <RingkasanTab onGoTo={setTab} /> },
          { key: 'transaksi', label: 'Transaksi', children: <TransaksiTab /> },
          { key: 'kewajiban', label: 'Kewajiban', children: <PengingatTab /> },
          { key: 'talangan', label: 'Talangan', children: <TalanganTab /> },
          { key: 'pengaturan', label: 'Pengaturan', children: <PengaturanTab /> },
        ]}
      />

      {catat === 'masuk' || catat === 'keluar' || catat === 'talangan' ? (
        <CatatTransaksiDialog mode={catat} onClose={() => setCatat(null)} />
      ) : null}
      {catat === 'transfer' ? <TransferDialog rekening={rekening} onClose={() => setCatat(null)} /> : null}
    </>
  );
}
