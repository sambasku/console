import {
  App as AntdApp,
  Badge,
  Button,
  Card,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { useEmailLogs, useEmailQuotas } from '../application/use-email';
import type { EmailLog, EmailLogStatus, EmailQuota } from '../domain/email';

const CATEGORY_LABELS: Record<string, string> = {
  otp: 'OTP verifikasi',
  reset_password: 'Reset password',
  account_deletion: 'Hapus akun',
  verifier_approved: 'Verifikator disetujui',
  test: 'Test kirim',
};

function statusBadge(s: EmailLogStatus) {
  if (s === 'sent') return <Badge status="success" text="Terkirim" />;
  if (s === 'failed') return <Badge status="error" text="Gagal" />;
  if (s === 'skipped_quota') return <Badge status="warning" text="Skip kuota" />;
  return <Badge status="default" text="Skip env" />;
}

export function SystemEmailPage() {
  const { message } = AntdApp.useApp();
  const [filter, setFilter] = useState<'all' | EmailLogStatus>('all');
  const logs = useEmailLogs(true, filter === 'all' ? undefined : filter);
  const quotas = useEmailQuotas(true);

  const logColumns = [
    {
      title: 'Waktu',
      dataIndex: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    { title: 'Kategori', dataIndex: 'category', width: 150, render: (v: string) => CATEGORY_LABELS[v] ?? v },
    { title: 'Tujuan', dataIndex: 'to_email', ellipsis: true },
    { title: 'Provider', dataIndex: 'provider', width: 100 },
    { title: 'Status', dataIndex: 'status', width: 120, render: (v: EmailLogStatus) => statusBadge(v) },
    {
      title: 'Error',
      dataIndex: 'error_message',
      ellipsis: true,
      render: (v: string | null, row: EmailLog) =>
        v ? <Typography.Text type="danger" ellipsis={{ tooltip: `${row.error_code ?? ''} ${v}` }}>{v}</Typography.Text> : '-',
    },
  ];

  const quotaColumns = [
    { title: 'Provider', dataIndex: 'provider' },
    {
      title: 'Status',
      dataIndex: 'active',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="green">Aktif</Tag> : <Tag>Nonaktif</Tag>),
    },
    {
      title: 'Hari ini',
      width: 130,
      render: (_: unknown, r: EmailQuota) => `${r.today_used} / ${r.daily_limit}`,
    },
    {
      title: 'Bulan ini',
      width: 140,
      render: (_: unknown, r: EmailQuota) => `${r.api_month_used + r.manual_used_effective} / ${r.monthly_limit}`,
    },
  ];

  return (
    <>
      <PageHeader title="Email" subtitle="Log kirim email OTP/reset dan kuota provider." />
      <Card
        title="Kuota provider"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => quotas.refetch()} loading={quotas.isFetching}>
            Muat ulang
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Table rowKey="provider" size="small" loading={quotas.isLoading} dataSource={quotas.data ?? []} columns={quotaColumns} pagination={false} />
      </Card>
      <Card
        title="Log kirim (50 terakhir)"
        extra={
          <Space>
            <Segmented
              value={filter}
              onChange={(v) => setFilter(v as typeof filter)}
              options={[
                { value: 'all', label: 'Semua' },
                { value: 'sent', label: 'Terkirim' },
                { value: 'failed', label: 'Gagal' },
                { value: 'skipped_quota', label: 'Skip kuota' },
                { value: 'skipped_env', label: 'Skip env' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => logs.refetch()} loading={logs.isFetching} />
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="small"
          loading={logs.isLoading}
          dataSource={logs.data?.logs ?? []}
          columns={logColumns}
          pagination={false}
          onRow={() => ({ onClick: () => message.info('Gunakan filter status untuk menyempitkan hasil.') })}
        />
        {logs.data?.next_cursor ? (
          <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            Ada lebih banyak log - muat ulang untuk data terbaru.
          </Typography.Paragraph>
        ) : null}
      </Card>
    </>
  );
}
