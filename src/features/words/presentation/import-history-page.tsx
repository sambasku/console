import { useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Input, Tag, Typography } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { useImportSessionList } from '../application/use-import-sessions';
import type { WordImportSession, WordImportSessionStatus } from '../infrastructure/word-api';
import { SUPPORT_TYPE_LABEL } from './import-attribution-fields';

const columnHelper = createColumnHelper<WordImportSession>();

const STATUS_LABEL: Record<WordImportSessionStatus, string> = {
  running: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
};

const STATUS_COLOR: Record<WordImportSessionStatus, string> = {
  running: 'processing',
  completed: 'success',
  cancelled: 'warning',
  failed: 'error',
};

export function ImportHistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { items, hasMore, loadMore, isLoading, isFetching, isFetchingNextPage, isError, error, refetch } =
    useImportSessionList(debouncedSearch);

  const columns = useMemo(
    () => [
      columnHelper.accessor('finished_at', {
        header: 'Waktu',
        size: 170,
        cell: (info) => formatDateTime(info.getValue() ?? info.row.original.created_at),
      }),
      columnHelper.accessor('source_label', {
        header: 'Sumber file',
        size: 160,
        cell: (info) => (
          <Button
            type="link"
            style={{ padding: 0, height: 'auto' }}
            onClick={() =>
              navigate({ to: '/words/import-history/$id', params: { id: info.row.original.id } })
            }
          >
            {info.getValue() || 'Tanpa label'}
          </Button>
        ),
      }),
      columnHelper.accessor('support_name', {
        header: 'Data Pendukung',
        size: 220,
        cell: (info) => {
          const row = info.row.original;
          const name = info.getValue();
          if (!name && !row.support_title) {
            return (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                -
              </Typography.Text>
            );
          }
          const typeLabel = row.support_type ? SUPPORT_TYPE_LABEL[row.support_type] : null;
          return (
            <Flex vertical style={{ minWidth: 0 }}>
              <Typography.Text ellipsis>{name || row.support_title}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                {[typeLabel, row.support_title && name ? row.support_title : null]
                  .filter(Boolean)
                  .join(' · ') || '-'}
              </Typography.Text>
            </Flex>
          );
        },
      }),
      columnHelper.accessor('attributed_to_username', {
        header: 'Atribusi',
        size: 180,
        cell: (info) =>
          personLabel(
            info.row.original.attributed_to_display_name,
            info.getValue(),
            'Pengimpor Data CSV',
          ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 110,
        cell: (info) => (
          <Tag color={STATUS_COLOR[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</Tag>
        ),
      }),
      columnHelper.display({
        id: 'summary',
        header: 'Ringkasan',
        size: 280,
        cell: (info) => {
          const row = info.row.original;
          return (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.created_count} baru · {row.duplicates_count} duplikat · {row.meanings_added_count}{' '}
              makna · {row.total} total
            </Typography.Text>
          );
        },
      }),
    ],
    [navigate],
  );

  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <PageHeader
        title="Riwayat impor"
        subtitle="Sesi impor massal (CSV / lembar) - Data Pendukung dan atribusi creator per batch."
        extra={
          <Flex gap={8}>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Muat ulang
            </Button>
            <Button onClick={() => navigate({ to: '/words' })}>Kembali ke Kata</Button>
          </Flex>
        }
      />
      <Input.Search
        allowClear
        placeholder="Cari nama situs, judul, alamat, atau label file…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 420 }}
      />
      {isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat riwayat impor"
          description={error?.message}
        />
      ) : null}
      <DataTable
        table={table}
        rowKey={(record) => record.id}
        loading={isLoading || (isFetching && !items.length)}
      />
      <Flex justify="center" align="center" gap={16} style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{items.length} sesi dimuat</Typography.Text>
        {hasMore ? (
          <Button onClick={() => void loadMore()} loading={isFetchingNextPage}>
            Muat lagi
          </Button>
        ) : null}
      </Flex>
    </>
  );
}
