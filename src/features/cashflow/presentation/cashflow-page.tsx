import { useState, type ReactNode } from 'react';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  HourglassOutlined,
  PlusOutlined,
  ReloadOutlined,
  SwapOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Card, Dropdown, Flex, Skeleton, Tabs, Tooltip, Typography, theme } from 'antd';
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

interface StatTileProps {
  label: string;
  value: number | undefined;
  hint: string;
  icon: ReactNode;
  color: string;
  bg: string;
  loading: boolean;
  /** Warna nilai. Default mengikuti teks biasa. */
  valueColor?: string;
}

/** Ringkasan satu angka: aksen warna di tepi kiri, ikon, label kecil, nilai besar. Penjelasan lewat tooltip. */
function StatTile({ label, value, hint, icon, color, bg, loading, valueColor }: StatTileProps) {
  return (
    <Tooltip title={hint}>
      <Card
        size="small"
        style={{ flex: '1 1 180px', borderInlineStart: `3px solid ${color}` }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        <Flex align="center" gap={10}>
          <Flex
            align="center"
            justify="center"
            style={{ width: 32, height: 32, borderRadius: 8, background: bg, color, fontSize: 16, flex: 'none' }}
          >
            {icon}
          </Flex>
          <Flex vertical style={{ minWidth: 0 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.3 }}>
              {label}
            </Typography.Text>
            {loading ? (
              <Skeleton.Input active size="small" style={{ width: 110, minWidth: 110, height: 24 }} />
            ) : (
              <Typography.Text strong style={{ fontSize: 18, lineHeight: 1.3, color: valueColor }}>
                {formatRupiah(value ?? 0)}
              </Typography.Text>
            )}
          </Flex>
        </Flex>
      </Card>
    </Tooltip>
  );
}

type TabKey = 'ringkasan' | 'transaksi' | RingkasanTujuan;
type CatatPilihan = CatatMode | 'transfer';

/**
 * Keuangan: uang masuk, uang keluar, talangan, dan kewajiban.
 * Hanya level admin ke atas. Pembatasan sebenarnya ada di middleware API; pengecekan di sini hanya UI.
 */
export function CashflowPage() {
  const { user } = useAuth();
  const { token } = theme.useToken();
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
  const saldoMinus = (data?.saldo_bersih ?? 0) < 0;
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

      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        <StatTile
          label="Kas fisik"
          value={data?.kas_fisik}
          hint="Total semua rekening"
          icon={<WalletOutlined />}
          color={token.colorPrimary}
          bg={token.colorPrimaryBg}
          loading={summary.isLoading}
        />
        <StatTile
          label="Talangan belum kembali"
          value={data?.sisa_talangan}
          hint="Harus dikembalikan dari dana masuk"
          icon={<HourglassOutlined />}
          color={token.colorWarning}
          bg={token.colorWarningBg}
          loading={summary.isLoading}
        />
        <StatTile
          label="Saldo bersih"
          value={data?.saldo_bersih}
          hint="Kas fisik dikurangi talangan. Boleh minus."
          icon={<BankOutlined />}
          color={saldoMinus ? token.colorError : token.colorSuccess}
          bg={saldoMinus ? token.colorErrorBg : token.colorSuccessBg}
          valueColor={saldoMinus ? token.colorError : undefined}
          loading={summary.isLoading}
        />
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
