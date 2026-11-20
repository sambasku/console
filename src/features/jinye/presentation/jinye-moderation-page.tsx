import { useMemo, useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import { ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Image,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useJinyeList, useTakedownJinye } from '../application/use-jinye';
import type { JinyeRow, JinyeStatus } from '../infrastructure/jinye-api';

const columnHelper = createColumnHelper<typeof tableFeatureSet, JinyeRow>();

const STATUS_COLOR: Record<string, string> = {
  published: 'green',
  archived: 'blue',
  taken_down: 'red',
  deleted_by_author: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  published: 'Tayang',
  archived: 'Arsip',
  taken_down: 'Ditarik',
  deleted_by_author: 'Dihapus penulis',
};

const STATUS_OPTIONS: { value: JinyeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'published', label: 'Tayang' },
  { value: 'archived', label: 'Arsip' },
  { value: 'taken_down', label: 'Ditarik' },
  { value: 'deleted_by_author', label: 'Dihapus penulis' },
];

/** Moderasi Jinye: list + filter username/status + takedown (bukan antrean approve foto). */
export function JinyeModerationPage() {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<JinyeStatus | 'all'>('all');
  const [username, setUsername] = useState('');
  const debouncedUsername = useDebouncedValue(username.trim(), 300);

  const list = useJinyeList({
    status: status === 'all' ? undefined : status,
    username: debouncedUsername || undefined,
  });
  const takedown = useTakedownJinye();

  async function onTakedown(row: JinyeRow) {
    try {
      await takedown.mutateAsync(row.id);
      message.success('Jinye ditarik dari feed');
      void list.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: 'body',
          header: 'Isi',
          size: 480,
          cell: (info) => {
            const row = info.row.original;
            return (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Paragraph
                  ellipsis={{ rows: 4, expandable: true }}
                  style={{ margin: 0, whiteSpace: 'pre-line' }}
                >
                  {row.body?.trim() || '-'}
                </Typography.Paragraph>
                {row.imageUrls.length > 0 ? (
                  <Image.PreviewGroup>
                    <Space size={6} wrap>
                      {row.imageUrls.map((src) => (
                        <Image
                          key={src}
                          src={src}
                          width={56}
                          height={56}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : null}
                {row.audioUrl ? (
                  <audio controls preload="none" src={row.audioUrl} style={{ width: '100%', maxWidth: 320 }}>
                    <track kind="captions" />
                  </audio>
                ) : null}
                {row.hasImages && row.imageUrls.length === 0 ? (
                  <Tag>Foto (URL kosong)</Tag>
                ) : null}
                {row.hasAudio && !row.audioUrl ? <Tag>Suara</Tag> : null}
              </Space>
            );
          },
        }),
        columnHelper.display({
          id: 'author',
          header: 'Penulis',
          size: 160,
          cell: (info) => {
            const row = info.row.original;
            return (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{row.displayName ?? '-'}</Typography.Text>
                <Typography.Text type="secondary">
                  @{row.username ?? '-'}
                </Typography.Text>
              </Space>
            );
          },
        }),
        columnHelper.accessor('status', {
          header: 'Status',
          size: 120,
          cell: (info) => (
            <Tag color={STATUS_COLOR[info.getValue()] ?? 'default'}>
              {STATUS_LABEL[info.getValue()] ?? info.getValue()}
            </Tag>
          ),
        }),
        columnHelper.accessor('createdAt', {
          header: 'Dikirim',
          size: 160,
          cell: (info) => formatDateTime(info.getValue()),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 120,
          cell: (info) => {
            const row = info.row.original;
            if (row.status !== 'published') return null;
            return (
              <Popconfirm
                title="Tarik Jinye ini dari feed?"
                description="Jinye (teks, foto, suara) langsung disembunyikan dari publik."
                okText="Tarik"
                okButtonProps={{ danger: true }}
                cancelText="Batal"
                onConfirm={() => void onTakedown(row)}
              >
                <Button type="link" danger>
                  Takedown
                </Button>
              </Popconfirm>
            );
          },
        }),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [takedown.isPending],
  );

  const table = useTable({
    features: tableFeatureSet,
    data: list.data ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <>
      <PageHeader
        title="Jinye"
        subtitle="Foto dan suara auto-tayang. Moderasi lewat Takedown di sini (atau laporan di Jinye Reports) - tidak ada antrean approve media."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void list.refetch()}>
            Muat ulang
          </Button>
        }
      />
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 180 }}
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => setStatus(v)}
        />
        <Input
          allowClear
          placeholder="Username penulis"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: 220 }}
        />
      </Space>
      <DataTable table={table} loading={list.isLoading} rowKey={(record) => record.id} />
    </>
  );
}
