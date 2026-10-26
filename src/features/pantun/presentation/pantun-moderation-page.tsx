import { useMemo } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import { ReloadOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { usePantuns, useTakedownPantun } from '../application/use-pantun';
import type { PantunRow } from '../infrastructure/pantun-api';

const columnHelper = createColumnHelper<typeof tableFeatureSet, PantunRow>();

const STATUS_COLOR: Record<string, string> = {
  published: 'green',
  taken_down: 'red',
  deleted_by_author: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  published: 'Tayang',
  taken_down: 'Ditarik',
  deleted_by_author: 'Dihapus penulis',
};

/** Moderasi pantun: list semua + takedown. */
export function PantunModerationPage() {
  const { message } = AntdApp.useApp();
  const pantuns = usePantuns();
  const takedown = useTakedownPantun();

  async function onTakedown(row: PantunRow) {
    try {
      await takedown.mutateAsync(row.id);
      message.success('Pantun ditarik dari feed');
      void pantuns.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: 'lines',
          header: 'Pantun',
          size: 420,
          cell: (info) => (
            <Typography.Paragraph
              ellipsis={{ rows: 4, expandable: true }}
              style={{ margin: 0, whiteSpace: 'pre-line' }}
            >
              {info.row.original.lines.join('\n')}
            </Typography.Paragraph>
          ),
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
                <Typography.Text type="secondary">@{row.username ?? '-'}</Typography.Text>
              </Space>
            );
          },
        }),
        columnHelper.accessor('rhymeScheme', {
          header: 'Rima',
          size: 90,
          cell: (info) => <Tag>{info.getValue()}</Tag>,
        }),
        columnHelper.accessor('language', {
          header: 'Bahasa',
          size: 90,
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
                title="Tarik pantun ini dari feed?"
                description="Pantun langsung disembunyikan dari publik."
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
    data: pantuns.data ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <>
      <PageHeader
        title="Moderasi Pantun"
        subtitle="Semua pantun (termasuk yang sudah ditarik). Pantun tayang langsung saat dikirim - takedown menyembunyikannya."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void pantuns.refetch()}>
            Muat ulang
          </Button>
        }
      />
      <DataTable table={table} loading={pantuns.isLoading} rowKey={(record) => record.id} />
    </>
  );
}
