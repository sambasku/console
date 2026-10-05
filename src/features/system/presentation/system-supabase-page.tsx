import { useMemo, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Badge,
  Button,
  Card,
  Flex,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import {
  useSupabaseHealthChecks,
  useTriggerSupabasePing,
} from '../application/use-supabase-health';
import type { SupabaseHealthCheck } from '../domain/supabase-health';

type EnvFilter = 'all' | 'staging' | 'production';

function StatusBadge({ row }: { row: SupabaseHealthCheck }) {
  if (row.status === 'failed') return <Badge status="error" text="Gagal" />;
  if (row.status === 'ok') return <Badge status="success" text="Sehat" />;
  return <Badge status="default" text={row.status} />;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** ponytail: cutoff dihitung di module scope; selisih beberapa ms saat HMR tidak relevan. */
const LAST_7D_CUTOFF = new Date(Date.now() - WEEK_MS);

function formatDuration(ms: number | null): string {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} dtk`;
}

const ENV_TAG_COLOR: Record<string, string> = { staging: 'gold', production: 'green' };

/**
 * System > Supabase - riwayat ping keep-alive.
 * Baris ditulis workflow Supabase Keep-Alive (repo api) via Turso;
 * halaman ini hanya baca. Tujuannya: bukti project tidak di-pause idle.
 */
export function SystemSupabasePage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const [envFilter, setEnvFilter] = useState<EnvFilter>('all');
  const query = useSupabaseHealthChecks(canManage, envFilter === 'all' ? undefined : envFilter);
  const ping = useTriggerSupabasePing();
  const items = useMemo(() => query.data?.items ?? [], [query.data]);

  const latest = items[0];
  const last7d = useMemo(
    () => items.filter((i) => new Date(i.createdAt) >= LAST_7D_CUTOFF),
    [items],
  );

  const columns = useMemo(
    () => [
      {
        title: 'Waktu',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 168,
        render: (v: string) => formatDateTime(v),
      },
      {
        title: 'Environment',
        dataIndex: 'env',
        key: 'env',
        width: 130,
        render: (v: string, row: SupabaseHealthCheck) => (
          <Flex vertical gap={0}>
            <Tag color={ENV_TAG_COLOR[v] ?? 'default'} style={{ width: 'fit-content' }}>
              {v}
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.projectLabel}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 100,
        render: (_: unknown, row: SupabaseHealthCheck) => <StatusBadge row={row} />,
      },
      {
        title: 'HTTP',
        dataIndex: 'httpStatus',
        key: 'httpStatus',
        width: 70,
        render: (v: number | null) => v ?? '-',
      },
      {
        title: 'Durasi',
        dataIndex: 'durationMs',
        key: 'durationMs',
        width: 90,
        render: (v: number | null) => formatDuration(v),
      },
      {
        title: 'Catatan',
        key: 'note',
        ellipsis: true,
        render: (_: unknown, row: SupabaseHealthCheck) => {
          if (row.githubRunUrl) {
            return (
              <Typography.Link href={row.githubRunUrl} target="_blank" rel="noreferrer">
                Actions run
              </Typography.Link>
            );
          }
          return row.errorMessage ? (
            <Typography.Text type="danger" ellipsis>
              {row.errorMessage}
            </Typography.Text>
          ) : (
            '-'
          );
        },
      },
    ],
    [],
  );

  if (!canManage) {
    return (
      <Alert type="warning" showIcon message="Hanya admin/root yang bisa melihat health check Supabase." />
    );
  }

  const onPing = async () => {
    try {
      const res = await ping.mutateAsync();
      if (res.status === 'ok') {
        message.success(`Ping sehat (HTTP ${res.http_status}, ${res.duration_ms} ms)`);
      } else {
        message.error(`Ping gagal: ${res.error_message ?? `HTTP ${res.http_status}`}`);
      }
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title="Supabase"
        subtitle="Riwayat keep-alive Supabase - mencegah project free tier di-pause karena idle"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>
              Refresh
            </Button>
            <Popconfirm
              title="Ping Supabase sekarang?"
              description="API fetch /auth/v1/health langsung, hasilnya masuk riwayat."
              okText="Ping"
              cancelText="Batal"
              onConfirm={() => void onPing()}
            >
              <Button type="primary" icon={<SendOutlined />} loading={ping.isPending}>
                Ping sekarang
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      <Alert
        type="info"
        showIcon
        message="Ping otomatis jalan Senin &amp; Kamis dari GitHub Actions."
        description="Hasil ping dicatat ke database (tabel supabase_health_checks) lalu tampil di sini. Kalau tidak ada baris baru lebih dari 7 hari, cek workflow Supabase Keep-Alive di repo api - kemungkinan disabled atau secret kosong. Project Supabase di-pause setelah 7 hari tanpa aktivitas."
      />

      <Flex gap={16} wrap="wrap">
        <Card size="small" style={{ minWidth: 220 }}>
          <Typography.Text type="secondary">Ping terakhir</Typography.Text>
          <div>
            {latest ? (
              <Flex gap={8} align="center">
                <StatusBadge row={latest} />
                <Typography.Text>{formatDateTime(latest.createdAt)}</Typography.Text>
              </Flex>
            ) : (
              <Typography.Text type="secondary">Belum ada data</Typography.Text>
            )}
          </div>
        </Card>
        <Card size="small" style={{ minWidth: 220 }}>
          <Typography.Text type="secondary">Ping 7 hari terakhir</Typography.Text>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {last7d.length}
          </Typography.Title>
        </Card>
      </Flex>

      <Card
        size="small"
        title="Riwayat health check"
        extra={
          <Segmented
            value={envFilter}
            onChange={(v) => setEnvFilter(v as EnvFilter)}
            options={[
              { value: 'all', label: 'Semua' },
              { value: 'staging', label: 'Staging' },
              { value: 'production', label: 'Produksi' },
            ]}
          />
        }
      >
        <Table
          rowKey="id"
          size="small"
          loading={query.isLoading}
          dataSource={items}
          columns={columns}
          pagination={false}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'Belum ada log - tunggu ping pertama dari workflow' }}
        />
      </Card>
    </Flex>
  );
}
