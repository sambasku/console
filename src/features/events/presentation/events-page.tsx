import { useMemo, useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  App as AntdApp,
  Button,
  Flex,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { useAuth } from '@/shared/auth/use-auth';
import type { Event, EventContribution, EventStatus } from '../domain/event';
import type { EventInput } from '../infrastructure/event-api';
import { listPlacesRequest } from '@/features/places/infrastructure/place-api';
import {
  useCreateEvent,
  useDeleteEvent,
  useEventCategories,
  useEventList,
  usePendingEventContributions,
  useReviewEventContribution,
  useSetEventCancelled,
  useUpdateEvent,
} from '../application/use-events';
import { useAllRegions } from '@/features/regions/application/use-regions';
import { EventDrawer } from './event-drawer';
import { EventProposalDrawer } from './event-proposal-drawer';

const columnHelper = createColumnHelper<typeof tableFeatureSet, Event>();

const OCCURRENCE_LABEL: Record<Event['occurrenceStatus'], string> = {
  upcoming: 'Akan datang',
  ongoing: 'Sedang berlangsung',
  completed: 'Sudah selesai',
  cancelled: 'Dibatalkan',
};

const OCCURRENCE_COLOR: Record<Event['occurrenceStatus'], string> = {
  upcoming: 'blue',
  ongoing: 'green',
  completed: 'default',
  cancelled: 'red',
};

function PendingProposals({
  rows,
  onPreview,
}: {
  rows: EventContribution[];
  onPreview: (row: EventContribution) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <Space direction="vertical" size={4} style={{ marginBottom: 16, width: '100%' }}>
      <Typography.Text strong>Usulan menunggu tinjauan ({rows.length})</Typography.Text>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {rows.map((row) => (
          <Space
            key={row.id}
            style={{
              width: '100%',
              justifyContent: 'space-between',
              padding: '8px 12px',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
            }}
          >
            <Space direction="vertical" size={0}>
              <Typography.Text>{row.payload.name}</Typography.Text>
              <Typography.Text type="secondary">
                {formatDateTime(row.payload.starts_at)} - {row.payload.location_text}
              </Typography.Text>
            </Space>
            <Tooltip title="Pratinjau">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => onPreview(row)}
              />
            </Tooltip>
          </Space>
        ))}
      </Space>
    </Space>
  );
}

export function EventsPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';
  const { message } = AntdApp.useApp();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<EventStatus | undefined>();
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const list = useEventList(canManage, {
    q: q || undefined,
    category_id: category,
    status,
    order,
  });
  const regions = useAllRegions(canManage);
  const categories = useEventCategories(canManage);
  const pending = usePendingEventContributions(canManage);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();
  const cancelMutation = useSetEventCancelled();
  const reviewMutation = useReviewEventContribution();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [proposal, setProposal] = useState<EventContribution | null>(null);

  // Katalog tourist spot untuk relasi event <-> place (multi-select).
  const placeCatalog = useQuery({
    queryKey: ['places', 'event-catalog'],
    queryFn: ({ signal }) => listPlacesRequest({ limit: 500 }, signal),
    enabled: drawerOpen && canManage,
    staleTime: 60_000,
  });

  const regionName = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of regions.data ?? []) map.set(r.id, r.name);
    return (id: string | null) => (id ? (map.get(id) ?? id) : '-');
  }, [regions.data]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          header: 'Nama',
          size: 240,
          cell: (info) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{info.getValue()}</Typography.Text>
              <Typography.Text type="secondary">{info.row.original.slug}</Typography.Text>
            </Space>
          ),
        }),
        columnHelper.accessor('startsAt', {
          header: 'Waktu',
          size: 170,
          cell: (info) => (
            <Space direction="vertical" size={0}>
              <Typography.Text>{formatDateTime(info.getValue())}</Typography.Text>
              <Typography.Text type="secondary">
                s/d {formatDateTime(info.row.original.endsAt)}
              </Typography.Text>
            </Space>
          ),
        }),
        columnHelper.accessor('occurrenceStatus', {
          header: 'Pelaksanaan',
          size: 140,
          cell: (info) => {
            const s = info.getValue();
            return <Tag color={OCCURRENCE_COLOR[s]}>{OCCURRENCE_LABEL[s]}</Tag>;
          },
        }),
        columnHelper.accessor('category', {
          header: 'Kategori',
          size: 140,
          cell: (info) => <Tag>{info.getValue()?.name ?? '-'}</Tag>,
        }),
        columnHelper.accessor('status', {
          header: 'Status',
          size: 110,
          cell: (info) => {
            const s = info.getValue();
            return (
              <Tag color={s === 'published' ? 'green' : s === 'draft' ? 'gold' : 'default'}>
                {s}
              </Tag>
            );
          },
        }),
        columnHelper.display({
          id: 'lokasi',
          header: 'Lokasi',
          size: 200,
          cell: (info) => {
            const row = info.row.original;
            return (
              <Space direction="vertical" size={0}>
                <Typography.Text ellipsis>{row.locationText}</Typography.Text>
                <Typography.Text type="secondary">
                  {row.village?.name ?? regionName(row.villageId)}
                </Typography.Text>
              </Space>
            );
          },
        }),
        columnHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 140,
          meta: { fixed: 'right' },
          cell: (info) => {
            const row = info.row.original;
            const cancelled = row.occurrenceStatus === 'cancelled';
            return (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(row);
                      setDrawerOpen(true);
                    }}
                  />
                </Tooltip>
                <Tooltip title={cancelled ? 'Pulihkan acara' : 'Batalkan acara'}>
                  <Button
                    type="link"
                    icon={<StopOutlined />}
                    onClick={async () => {
                      try {
                        await cancelMutation.mutateAsync({ id: row.id, cancelled: !cancelled });
                        message.success(cancelled ? 'Acara dipulihkan' : 'Acara dibatalkan');
                      } catch (err) {
                        message.error(normalizeError(err).message);
                      }
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title="Hapus acara ini?"
                  description="Soft delete - hilang dari app publik."
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Acara dihapus');
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  <Button type="link" danger icon={<DeleteOutlined />} aria-label="Hapus" />
                </Popconfirm>
              </Space>
            );
          },
        }),
      ]),
    [cancelMutation, message, regionName],
  );

  const table = useTable({
    features: tableFeatureSet,
    data: list.items,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
  });

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin, root, atau reviewer yang bisa mengelola acara.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Acara"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Muat ulang
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              Acara baru
            </Button>
          </Space>
        }
      />

      <PendingProposals
        rows={pending.data ?? []}
        onPreview={setProposal}
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Cari nama / slug"
          allowClear
          onSearch={setQ}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="Kategori"
          style={{ width: 160 }}
          onChange={(v) => setCategory(v)}
          options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 140 }}
          onChange={(v) => setStatus(v)}
          options={[
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
        <Select
          placeholder="Urutan"
          style={{ width: 180 }}
          value={order}
          onChange={(v) => setOrder(v)}
          options={[
            { value: 'desc', label: 'Terbaru dulu' },
            { value: 'asc', label: 'Paling dekat dulu' },
          ]}
        />
      </Space>

      {list.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat acara"
          description={normalizeError(list.error).message}
        />
      ) : null}

      <DataTable
        table={table}
        rowKey={(record) => record.id}
        loading={list.isLoading || (list.isFetching && list.items.length === 0)}
      />

      <Flex justify="center" align="center" gap={16} style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{list.items.length} entri dimuat</Typography.Text>
        {list.hasMore ? (
          <Button onClick={() => list.loadMore()} loading={list.isFetchingNextPage}>
            Muat lagi
          </Button>
        ) : null}
      </Flex>

      <EventProposalDrawer
        proposal={proposal}
        categoryName={(id) =>
          (categories.data ?? []).find((c) => c.id === id)?.name ?? id
        }
        regionName={regionName}
        onClose={() => setProposal(null)}
        onReviewed={() => {
          void pending.refetch();
          void list.refetch();
        }}
        review={(params) => reviewMutation.mutateAsync(params)}
      />

      <EventDrawer
        open={drawerOpen}
        editing={editing}
        placeCatalog={(placeCatalog.data?.items ?? []).map((p) => ({
          id: p.id,
          name: p.name,
        }))}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => void list.refetch()}
        submit={async (values) => {
          if ('id' in values && values.id) {
            const { id, ...body } = values;
            return updateMutation.mutateAsync({ id, ...body });
          }
          return createMutation.mutateAsync(values as EventInput);
        }}
      />
    </>
  );
}
