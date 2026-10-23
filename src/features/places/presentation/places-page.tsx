import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import type { Place, PlaceCategory, PlaceStatus } from '../domain/place';
import type { PlaceInput, PlaceProposal } from '../infrastructure/place-api';
import { listPendingProposals, listPlacesRequest } from '../infrastructure/place-api';
import {
  useCreatePlace,
  useDeletePlace,
  usePlaceList,
  usePlaceViews,
  usePlaceViewsReport,
  useUpdatePlace,
} from '../application/use-places';
import { useAllRegions } from '@/features/regions/application/use-regions';
import { useAllPlaceCategories } from '@/features/place-categories/application/use-place-categories';
import { PlaceDrawer } from './place-drawer';
import { PlaceProposalDrawer } from './place-proposal-drawer';

const columnHelper = createColumnHelper<typeof tableFeatureSet, Place>();

/**
 * Top 10 wisata terpopuler. Sumbernya laporan yang sama dengan halaman
 * analitik (`/admin/places/views/daily`) - nama ikut dari server supaya
 * tidak terbatas halaman tabel yang sedang dimuat.
 */
function TopPlaces({ days }: { days: number | 'all' }) {
  const report = usePlaceViewsReport(days === 'all' ? 3650 : days);
  const top = (report.data?.items ?? []).slice(0, 10);
  if (top.length === 0) return null;
  return (
    <Table
      style={{ marginBottom: 16 }}
      rowKey="placeId"
      pagination={false}
      size="small"
      title={() => 'Wisata terpopuler'}
      dataSource={top}
      columns={[
        { title: 'Wisata', dataIndex: 'name' },
        { title: 'Kategori', dataIndex: 'category', width: 120 },
        { title: 'Dilihat', dataIndex: 'views', width: 100 },
        { title: 'Terakhir dilihat', dataIndex: 'lastViewed', width: 140 },
      ]}
    />
  );
}

function PendingProposals({
  onPreview,
  reloadKey,
}: {
  onPreview: (row: PlaceProposal) => void;
  reloadKey: number;
}) {
  const [rows, setRows] = useState<PlaceProposal[]>([]);
  const load = () => {
    void listPendingProposals().then(setRows).catch(() => setRows([]));
  };
  useEffect(load, [reloadKey]);
  if (rows.length === 0) return null;
  return (
    <Table
      style={{ marginBottom: 16 }}
      rowKey="id"
      pagination={false}
      dataSource={rows}
      title={() => 'Usulan menunggu tinjauan'}
      columns={[
        // `as const`: TS7 infer array literal jadi `string[]`, bukan tuple
        // path - tanpa ini `dataIndex` tidak cocok dengan tipe antd.
        { title: 'Nama', dataIndex: ['payload', 'name'] as const },
        { title: 'Slug', dataIndex: ['payload', 'slug'] as const },
        {
          title: 'Jenis',
          width: 140,
          render: (_, row) => (row.place_id ? 'Suntingan' : 'Tempat baru'),
        },
        {
          title: 'Aksi',
          width: 80,
          render: (_, row) => (
            <Tooltip title="Pratinjau">
              <Button type="link" icon={<EyeOutlined />} onClick={() => onPreview(row)} />
            </Tooltip>
          ),
        },
      ]}
    />
  );
}

export function PlacesPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';
  const { message } = AntdApp.useApp();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<PlaceCategory | undefined>();
  const [status, setStatus] = useState<PlaceStatus | undefined>();
  const list = usePlaceList(canManage, { q: q || undefined, category, status });
  const regions = useAllRegions(canManage);
  const categories = useAllPlaceCategories(canManage);
  const createMutation = useCreatePlace();
  const updateMutation = useUpdatePlace();
  const deleteMutation = useDeletePlace();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [proposal, setProposal] = useState<PlaceProposal | null>(null);
  const [proposalReload, setProposalReload] = useState(0);
  const [viewDays, setViewDays] = useState<number | 'all'>(30);
  const views = usePlaceViews(viewDays === 'all' ? undefined : viewDays);

  const catalog = useQuery({
    queryKey: ['places', 'name-catalog'],
    queryFn: ({ signal }) => listPlacesRequest({ limit: 500 }, signal),
    enabled: drawerOpen && canManage,
    staleTime: 60_000,
  });

  const regionName = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of regions.data ?? []) map.set(r.id, r.name);
    return (id: string | null) => (id ? (map.get(id) ?? id) : '-');
  }, [regions.data]);

  const categoryName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories.data ?? []) map.set(c.id, c.name);
    return (id: string) => map.get(id) ?? id;
  }, [categories.data]);

  const columns = useMemo(
    () => columnHelper.columns([
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
      columnHelper.accessor('images', {
        header: 'Foto',
        size: 80,
        cell: (info) => info.getValue().length,
      }),
      columnHelper.accessor('category', {
        header: 'Kategori',
        size: 120,
        cell: (info) => <Tag>{categoryName(info.getValue())}</Tag>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 120,
        cell: (info) => {
          const s = info.getValue();
          return (
            <Tag color={s === 'published' ? 'green' : s === 'draft' ? 'gold' : 'default'}>{s}</Tag>
          );
        },
      }),
      columnHelper.display({
        id: 'views',
        header: 'Dilihat',
        size: 90,
        cell: (info) => (
          <Tooltip title="Pembaca unik: 1 orang dihitung sekali per hari walau refresh berkali-kali.">
            <Typography.Text>{views.data?.get(info.row.original.id) ?? 0}</Typography.Text>
          </Tooltip>
        ),
      }),
      columnHelper.display({
        id: 'wilayah',
        header: 'Wilayah',
        size: 220,
        cell: (info) => {
          const row = info.row.original;
          return `${regionName(row.regionId)} / ${row.villageId ? regionName(row.villageId) : '-'}`;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        size: 100,
        meta: { fixed: 'right' },
        cell: (info) => {
          const row = info.row.original;
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
              <Popconfirm
                title="Hapus wisata ini?"
                description="Soft delete - hilang dari app publik."
                onConfirm={async () => {
                  try {
                    await deleteMutation.mutateAsync(row.id);
                    message.success('Wisata dihapus');
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
    [categoryName, regionName, deleteMutation, message, views.data],
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
        Hanya admin, root, atau reviewer yang bisa mengelola wisata.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Wisata"
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
              Wisata baru
            </Button>
          </Space>
        }
      />

      <PendingProposals reloadKey={proposalReload} onPreview={setProposal} />
      <TopPlaces days={viewDays} />

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
          style={{ width: 140 }}
          onChange={(v) => setCategory(v)}
          options={(categories.data ?? []).map((c) => ({
            value: c.id,
            label: c.name,
          }))}
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
          placeholder="Periode Dilihat"
          style={{ width: 140 }}
          value={viewDays}
          onChange={(v) => setViewDays(v)}
          options={[
            { value: 7, label: '7 hari' },
            { value: 30, label: '30 hari' },
            { value: 'all', label: 'Semua waktu' },
          ]}
        />
      </Space>

      {list.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat wisata"
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

      <PlaceProposalDrawer
        proposal={proposal}
        categoryName={categoryName}
        regionName={regionName}
        onClose={() => setProposal(null)}
        onReviewed={() => {
          setProposalReload((n) => n + 1);
          void list.refetch();
        }}
      />

      <PlaceDrawer
        open={drawerOpen}
        editing={editing}
        catalog={(catalog.data?.items ?? list.items).map((p) => ({
          slug: p.slug,
          name: p.name,
        }))}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => list.refetch()}
        submit={async (values) => {
          if ('id' in values && values.id) {
            const { id, ...body } = values;
            return updateMutation.mutateAsync({ id, ...body });
          }
          return createMutation.mutateAsync(values as PlaceInput);
        }}
      />
    </>
  );
}
