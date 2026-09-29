import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Badge,
  Button,
  Card,
  Flex,
  Popconfirm,
  Space,
  Switch,
  Table,
  Typography,
  theme,
} from 'antd';
import { CloudServerOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import {
  useDatabaseBackupLogs,
  useTriggerDatabaseBackup,
} from '../application/use-database-backup';
import { isBackupActive, type DatabaseBackupLog } from '../domain/database-backup';

function formatBytes(n: number | null): string {
  if (n == null) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms} ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} dtk`;
  return `${Math.floor(s / 60)} m ${s % 60} dtk`;
}

/** Kuning berdenyut = berjalan, merah = gagal, hijau = berhasil. */
function BackupStatusBadge({ status }: { status: string }) {
  const { token } = theme.useToken();
  if (isBackupActive(status)) {
    return <Badge status="processing" color={token.colorWarning} text="Berjalan" />;
  }
  if (status === 'failed') return <Badge status="error" text="Gagal" />;
  if (status === 'succeeded') return <Badge status="success" text="Berhasil" />;
  return <Badge status="default" text={status} />;
}

function LatestBackupStatus({ row }: { row: DatabaseBackupLog }) {
  const detail = isBackupActive(row.status)
    ? `Diproses di latar belakang sejak ${formatDateTime(row.createdAt)}`
    : row.status === 'failed'
      ? (row.errorMessage ?? 'Backup gagal')
      : `${formatBytes(row.sizeBytes)} · ${formatDuration(row.durationMs)}`;
  return (
    <Flex vertical gap={2}>
      <Space size={8}>
        <BackupStatusBadge status={row.status} />
        {row.dryRun ? <Typography.Text type="secondary">dry-run</Typography.Text> : null}
      </Space>
      <Typography.Text type={row.status === 'failed' ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
        {detail}
      </Typography.Text>
    </Flex>
  );
}

/**
 * System > Database - trigger backup encrypted ke sambasku/sqlite + tabel log.
 * Status dipantau di sini (poll), admin tidak perlu membuka GitHub Actions.
 */
export function SystemDatabasePage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const [dryRun, setDryRun] = useState(false);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const logsQuery = useDatabaseBackupLogs(canManage);
  const trigger = useTriggerDatabaseBackup();

  const items = logsQuery.data?.items ?? [];
  const tracked = trackedId ? items.find((i) => i.id === trackedId) : undefined;
  const latest = tracked ?? items[0];
  const anyActive = items.some((i) => isBackupActive(i.status));

  const notifiedId = useRef<string | null>(null);
  useEffect(() => {
    if (!tracked || isBackupActive(tracked.status) || notifiedId.current === tracked.id) return;
    notifiedId.current = tracked.id;
    if (tracked.status === 'succeeded') message.success('Backup berhasil');
    else message.error(`Backup gagal: ${tracked.errorMessage ?? 'lihat riwayat'}`);
  }, [tracked, message]);

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
        title: 'Trigger',
        key: 'trigger',
        width: 140,
        render: (_: unknown, row: DatabaseBackupLog) => (
          <Flex vertical gap={0}>
            <Typography.Text>{row.triggeredByUsername ?? '-'}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.triggerSource}
              {row.dryRun ? ' · dry-run' : ''}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (s: string) => <BackupStatusBadge status={s} />,
      },
      {
        title: 'Mulai / Selesai',
        key: 'times',
        width: 200,
        render: (_: unknown, row: DatabaseBackupLog) => (
          <Flex vertical gap={0} style={{ fontSize: 12 }}>
            <span>{row.timeStart ? formatDateTime(row.timeStart) : '-'}</span>
            <span>{row.timeEnd ? formatDateTime(row.timeEnd) : '-'}</span>
          </Flex>
        ),
      },
      {
        title: 'Durasi',
        dataIndex: 'durationMs',
        key: 'durationMs',
        width: 90,
        render: (v: number | null) => formatDuration(v),
      },
      {
        title: (
          <span title="Ukuran file .tar.gz.age terenkripsi (bukan raw .db)">
            Size
          </span>
        ),
        dataIndex: 'sizeBytes',
        key: 'sizeBytes',
        width: 90,
        render: (v: number | null) => formatBytes(v),
      },
      {
        title: 'Asset',
        key: 'asset',
        ellipsis: true,
        render: (_: unknown, row: DatabaseBackupLog) => {
          if (row.releaseUrl) {
            return (
              <Typography.Link href={row.releaseUrl} target="_blank" rel="noreferrer">
                {row.githubReleaseTag ?? row.assetName ?? 'Release'}
              </Typography.Link>
            );
          }
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
      <Alert type="warning" showIcon message="Hanya admin/root yang dapat mengelola backup DB." />
    );
  }

  const onBackup = async () => {
    try {
      const res = await trigger.mutateAsync(dryRun);
      setTrackedId(res.logId);
      message.info(dryRun ? 'Dry-run dimulai' : 'Backup dimulai');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title="Database"
        subtitle="Backup penuh Turso terenkripsi (age) ke repo sambasku/sqlite"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void logsQuery.refetch()}>
            Refresh log
          </Button>
        }
      />

      <Alert
        type="info"
        showIcon
        message="Status backup diperbarui otomatis di halaman ini."
        description="Secret DATABASE_URL di repo sqlite menentukan DB yang di-backup dan tempat log diperbarui. Pastikan sama dengan Turso environment console ini; jika beda, status akan timeout (gagal) setelah 30 menit. Size = file .tar.gz.age terenkripsi."
      />

      <Card size="small" title="Aksi backup">
        <Flex align="center" justify="space-between" gap={16} wrap="wrap">
          <Flex align="center" gap={16} wrap="wrap">
            <Space>
              <Switch checked={dryRun} onChange={setDryRun} disabled={anyActive} />
              <Typography.Text>Dry run (tanpa GitHub Release)</Typography.Text>
            </Space>
            <Popconfirm
              title={dryRun ? 'Jalankan dry-run backup?' : 'Jalankan backup + Release?'}
              description="Backup berjalan di latar belakang, biasanya 1-2 menit."
              okText="Jalankan"
              cancelText="Batal"
              disabled={anyActive}
              onConfirm={() => void onBackup()}
            >
              <Button
                type="primary"
                icon={<CloudServerOutlined />}
                loading={trigger.isPending}
                disabled={anyActive}
              >
                {anyActive ? 'Backup berjalan...' : 'Jalankan backup'}
              </Button>
            </Popconfirm>
          </Flex>
          {latest ? <LatestBackupStatus row={latest} /> : null}
        </Flex>
      </Card>

      <Card size="small" title="Riwayat backup">
        <Table
          rowKey="id"
          size="small"
          loading={logsQuery.isLoading}
          dataSource={items}
          columns={columns}
          pagination={false}
          scroll={{ x: 960 }}
          locale={{ emptyText: 'Belum ada log - jalankan backup' }}
        />
      </Card>
    </Flex>
  );
}
