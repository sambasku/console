import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Statistic, Tabs, Typography } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { formatRupiah } from '../domain/cashflow';
import { useCashflowSummary } from '../application/use-cashflow';
import { TransaksiTab } from './transaksi-tab';
import { TalanganTab } from './talangan-tab';
import { PengingatTab } from './pengingat-tab';
import { PengaturanTab } from './pengaturan-tab';

const formatStat = (value: string | number | undefined) => formatRupiah(Number(value ?? 0));

/** Modul cashflow sederhana: uang masuk, uang keluar, talangan, dan pengingat kewajiban. */
export function CashflowPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const summary = useCashflowSummary(canManage);

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola cashflow.
      </Typography.Text>
    );
  }

  const data = summary.data;

  return (
    <>
      <PageHeader
        title="Cashflow"
        subtitle="Uang masuk, uang keluar, talangan, dan pengingat kewajiban"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => summary.refetch()}>
            Muat ulang
          </Button>
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
        defaultActiveKey="transaksi"
        items={[
          { key: 'transaksi', label: 'Transaksi', children: <TransaksiTab /> },
          { key: 'talangan', label: 'Talangan', children: <TalanganTab /> },
          { key: 'pengingat', label: 'Pengingat', children: <PengingatTab /> },
          { key: 'pengaturan', label: 'Pengaturan', children: <PengaturanTab /> },
        ]}
      />
    </>
  );
}
