import { useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Flex,
  Popconfirm,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { tableFeatureSet } from '../../../shared/components/table-features';
import {
  type Translation,
  type TranslationStatus,
} from '../infrastructure/translation-api';
import {
  useResolveTranslation,
  useTranslations,
} from '../application/use-translations';

const columnHelper = createColumnHelper<typeof tableFeatureSet, Translation>();

const STATUS_LABEL: Record<TranslationStatus, string> = {
  pending: 'Menunggu',
  accepted: 'Diterima',
  rejected: 'Ditolak',
};

const STATUS_COLOR: Record<TranslationStatus, string> = {
  pending: 'gold',
  accepted: 'green',
  rejected: 'default',
};

export function TranslationsPage() {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<TranslationStatus>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = useTranslations({ reff: 'jinye', status });
  const resolve = useResolveTranslation();

  const onResolve = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      await resolve.mutateAsync({ id, action });
      message.success(
        action === 'approve'
          ? 'Terjemahan diterima'
          : 'Terjemahan ditolak',
      );
      void list.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const columns = columnHelper.columns([
    columnHelper.display({
      id: 'sourceBody',
      header: 'Teks sumber',
      size: 280,
      cell: (info) => {
        const row = info.row.original;
        return (
          <Space direction="vertical" size={2}>
            <Tag>{row.reff}</Tag>
            <Typography.Paragraph
              ellipsis={{ rows: 4, expandable: true }}
              style={{ margin: 0, whiteSpace: 'pre-line' }}
            >
              {row.sourceBody.trim() || '-'}
            </Typography.Paragraph>
          </Space>
        );
      },
    }),
    columnHelper.display({
      id: 'body',
      header: 'Terjemahan',
      size: 280,
      cell: (info) => (
        <Typography.Paragraph
          ellipsis={{ rows: 4, expandable: true }}
          style={{ margin: 0, whiteSpace: 'pre-line' }}
        >
          {info.row.original.body}
        </Typography.Paragraph>
      ),
    }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      size: 120,
      cell: (info) => {
        const s = info.row.original.status;
        return <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>;
      },
    }),
    columnHelper.display({
      id: 'created',
      header: 'Diajukan',
      size: 160,
      cell: (info) => formatDateTime(info.row.original.createdAt),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Aksi',
      size: 200,
      cell: (info) => {
        const row = info.row.original;
        if (row.status !== 'pending') return '-';
        const busy = busyId === row.id;
        return (
          <Space>
            <Popconfirm
              title="Terima terjemahan ini?"
              okText="Terima"
              cancelText="Batal"
              onConfirm={() => void onResolve(row.id, 'approve')}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={busy}
                disabled={busyId != null && !busy}
              >
                Terima
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Tolak terjemahan ini?"
              okText="Tolak"
              cancelText="Batal"
              onConfirm={() => void onResolve(row.id, 'reject')}
            >
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                loading={busy}
                disabled={busyId != null && !busy}
              >
                Tolak
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    }),
  ]);

  const table = useTable({
    features: tableFeatureSet,
    data: list.data ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title="Usulan terjemahan"
        subtitle="Antrian terjemahan generik (saat ini sumber Jinye). Terima atau tolak usulan pending."
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void list.refetch()}
            loading={list.isFetching}
          >
            Muat ulang
          </Button>
        }
      />
      <Segmented
        value={status}
        onChange={(v) => setStatus(v as TranslationStatus)}
        options={[
          { label: 'Menunggu', value: 'pending' },
          { label: 'Diterima', value: 'accepted' },
          { label: 'Ditolak', value: 'rejected' },
        ]}
      />
      <DataTable
        table={table}
        rowKey={(record) => record.id}
        loading={list.isLoading}
      />
    </Flex>
  );
}
