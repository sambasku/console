import { useMemo, useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '@/shared/components/table-features';
import { ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Tabs, Tag, Tooltip, Typography } from 'antd';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { useNavigate } from '@tanstack/react-router';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { useAuth } from '@/shared/auth/use-auth';
import { useLemmaMergeList } from '../application/use-lemma-merge-list';
import {
  LEMMA_MERGE_STATUS_LABELS,
  type LemmaMergeListItem,
  type LemmaMergeStatus,
} from '../domain/lemma-merge';

const columnHelper = createColumnHelper<typeof tableFeatureSet, LemmaMergeListItem>();

const STATUS_TAG_COLOR: Record<LemmaMergeStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

type StatusTab = LemmaMergeStatus | 'all';

const STATUS_TABS: { key: StatusTab; label: string; status?: LemmaMergeStatus }[] = [
  { key: 'pending', label: LEMMA_MERGE_STATUS_LABELS.pending, status: 'pending' },
  { key: 'approved', label: LEMMA_MERGE_STATUS_LABELS.approved, status: 'approved' },
  { key: 'rejected', label: LEMMA_MERGE_STATUS_LABELS.rejected, status: 'rejected' },
  { key: 'all', label: 'Semua' },
];

export function LemmaMergesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState<StatusTab>('pending');
  const status = STATUS_TABS.find((t) => t.key === statusTab)?.status;
  const canModerate =
    user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'root';

  const { items, hasMore, loadMore, isLoading, isFetching, isFetchingNextPage, isError, error, refetch } =
    useLemmaMergeList({ status, enabled: canModerate });

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('proposer_display_name', {
          header: 'Pengusul',
          size: 160,
          cell: (info) => (
            <Typography.Text strong>
              {info.getValue()?.trim() || info.row.original.proposer_username || '-'}
            </Typography.Text>
          ),
        }),
        columnHelper.accessor('keep_lemma', {
          header: 'Lemma utama',
          size: 140,
        }),
        columnHelper.accessor('merge_lemmas', {
          header: 'Digabung',
          size: 200,
          cell: (info) => {
            const merged = info.getValue().filter((l) => l.trim() && l !== '-');
            const label = merged.length > 0 ? merged.join(', ') : `${info.row.original.merge_count} entri`;
            return (
              <Typography.Text ellipsis={{ tooltip: label }}>
                {label}
              </Typography.Text>
            );
          },
        }),
        columnHelper.accessor('reason_text', {
          header: 'Alasan',
          size: 240,
          cell: (info) => (
            <Typography.Text ellipsis={{ tooltip: info.getValue() ?? '-' }}>
              {info.getValue()?.trim() || '-'}
            </Typography.Text>
          ),
        }),
        columnHelper.accessor('status', {
          header: 'Status',
          size: 110,
          cell: (info) => (
            <Tag color={STATUS_TAG_COLOR[info.getValue()]}>
              {LEMMA_MERGE_STATUS_LABELS[info.getValue()]}
            </Tag>
          ),
        }),
        columnHelper.accessor('created_at', {
          header: 'Diajukan',
          size: 140,
          cell: (info) => formatDateTime(info.getValue()),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 72,
          meta: { fixed: 'right' },
          cell: (info) => (
            <Tooltip title="Tinjau">
              <Button
                type="link"
                icon={<ToolOutlined />}
                onClick={() =>
                  void navigate({
                    to: '/lemma-merges/$id',
                    params: { id: info.row.original.id },
                  })
                }
              />
            </Tooltip>
          ),
        }),
      ]),
    [navigate],
  );

  const table = useTable({
    features: tableFeatureSet,
    data: items,
    columns,
    getRowId: (row) => String(row.id),
    manualPagination: true,
  });

  if (!canModerate) {
    return (
      <Alert type="warning" showIcon message="Hanya verifikator dan admin yang bisa membuka antrean ini." />
    );
  }

  return (
    <>
      <PageHeader
        title="Gabung kata"
        subtitle="Usulan menggabungkan beberapa entri lemma serupa ke satu entri utama."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void refetch()} loading={isFetching}>
            Muat ulang
          </Button>
        }
      />
      <Tabs
        activeKey={statusTab}
        onChange={(k) => setStatusTab(k as StatusTab)}
        items={STATUS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        style={{ marginBottom: 8 }}
      />
      {isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat data"
          description={error instanceof Error ? error.message : undefined}
        />
      ) : null}
      <DataTable
        table={table}
        rowKey={(record) => String(record.id)}
        loading={isLoading || (isFetching && !items.length)}
      />
      <Flex justify="center" align="center" gap={16} style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{items.length} entri dimuat</Typography.Text>
        {hasMore ? (
          <Button onClick={() => loadMore()} loading={isFetchingNextPage}>
            Muat lagi
          </Button>
        ) : null}
      </Flex>
    </>
  );
}