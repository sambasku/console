import { useMemo, useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { tableFeatureSet } from '../../../shared/components/table-features';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { useAuth } from '@/shared/auth/use-auth';
import type {
  Cuisine,
  CulinaryContribution,
  CulinaryPlace,
  CulinaryPlaceType,
  CulinaryPublishStatus,
} from '../domain/culinary';
import type { CuisineInput, PlaceInput } from '../infrastructure/culinary-api';
import { listCulinaryDuplicatesRequest } from '../infrastructure/culinary-api';
import {
  useCreateCuisine,
  useCreatePlace,
  useCuisines,
  useCulinaryCategories,
  useCulinaryPlaces,
  useDeleteCuisine,
  useDeletePlace,
  usePendingCulinaryContributions,
  useRestoreCuisine,
  useRestorePlace,
  useRestrictCuisine,
  useRestrictPlace,
  useReviewCulinaryContribution,
  useUpdateCuisine,
  useUpdatePlace,
} from '../application/use-culinary';
import {
  CULINARY_OPERATIONAL_STATUS_OPTIONS,
  CULINARY_PLACE_TYPE_OPTIONS,
  CULINARY_PUBLISH_STATUS_OPTIONS,
  CuisineDrawer,
  PlaceDrawer,
} from './culinary-drawer';
import { CulinaryProposalDrawer } from './culinary-proposal-drawer';

const cuisineHelper = createColumnHelper<typeof tableFeatureSet, Cuisine>();
const placeHelper = createColumnHelper<typeof tableFeatureSet, CulinaryPlace>();

const PUBLISH_COLOR: Record<CulinaryPublishStatus, string> = {
  published: 'green',
  draft: 'gold',
  archived: 'default',
  restricted: 'red',
};

const OPERATIONAL_LABEL: Record<CulinaryPlace['operationalStatus'], string> = {
  unknown: 'Belum diketahui',
  operating: 'Buka',
  temporarily_closed: 'Tutup sementara',
  permanently_closed: 'Tutup permanen',
};

const OPERATIONAL_COLOR: Record<CulinaryPlace['operationalStatus'], string> = {
  unknown: 'default',
  operating: 'green',
  temporarily_closed: 'orange',
  permanently_closed: 'red',
};

const PLACE_TYPE_LABEL: Record<CulinaryPlaceType, string> = {
  restaurant: 'Restoran',
  warung: 'Warung',
  kedai: 'Kedai',
  market_stall: 'Lapak pasar',
  street_vendor: 'Pedagang keliling',
  home_industry: 'Industri rumahan',
  other: 'Lainnya',
};

function PendingProposals({
  rows,
  onPreview,
}: {
  rows: CulinaryContribution[];
  onPreview: (row: CulinaryContribution) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  if (rows.length === 0) return null;
  const visible = showAll ? rows : rows.slice(0, 5);
  return (
    <Space direction="vertical" size={4} style={{ marginBottom: 16, width: '100%' }}>
      <Space>
        <Typography.Text strong>Pengajuan menunggu tinjauan ({rows.length})</Typography.Text>
        {rows.length > 5 ? (
          <Button type="link" size="small" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Ringkas' : `Lihat semua ${rows.length}`}
          </Button>
        ) : null}
      </Space>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {visible.map((row) => (
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
              <Typography.Text>
                {String(row.payload.name ?? row.cuisineName ?? row.placeName ?? 'Pengajuan')}
              </Typography.Text>
              <Typography.Text type="secondary">
                {row.kind} - {formatDateTime(row.createdAt)}
                {row.cuisineSlug ? ` - ${row.cuisineSlug}` : ''}
                {row.placeSlug ? ` - ${row.placeSlug}` : ''}
              </Typography.Text>
            </Space>
            <Tooltip title="Pratinjau">
              <Button type="link" icon={<EyeOutlined />} onClick={() => onPreview(row)} />
            </Tooltip>
          </Space>
        ))}
      </Space>
    </Space>
  );
}

function DuplicateHints({
  kind,
  target,
  onClose,
}: {
  kind: 'cuisine' | 'place';
  target: { id: string; name: string };
  onClose: () => void;
}) {
  const duplicates = useQuery({
    queryKey: ['culinary', 'duplicates', kind, target.id],
    queryFn: ({ signal }) =>
      listCulinaryDuplicatesRequest(
        kind,
        { q: target.name, exclude_id: target.id },
        signal,
      ),
  });
  const rows = duplicates.data ?? [];
  return (
    <Modal
      title={`Kemiripan dengan ${target.name}`}
      open
      onCancel={onClose}
      footer={<Button onClick={onClose}>Tutup</Button>}
      destroyOnHidden
    >
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          Saran read-only - tidak ada merge otomatis. Tinjau manual.
        </Typography.Text>
        {duplicates.isLoading ? <Typography.Text>Memeriksa...</Typography.Text> : null}
        {rows.length === 0 && !duplicates.isLoading ? (
          <Typography.Text>Tidak ada kandidat duplikat.</Typography.Text>
        ) : null}
        {rows.map((d) => (
          <Typography.Text key={d.id}>
            {d.name} ({d.slug})
          </Typography.Text>
        ))}
      </Space>
    </Modal>
  );
}

export function CulinaryPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';
  const { message } = AntdApp.useApp();
  const [tab, setTab] = useState<'cuisine' | 'place'>('cuisine');

  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<CulinaryPublishStatus | undefined>();
  const [type, setType] = useState<CulinaryPlaceType | undefined>();
  const [operational, setOperational] = useState<
    CulinaryPlace['operationalStatus'] | undefined
  >();

  const cuisines = useCuisines(canManage, {
    q: q || undefined,
    category_id: category,
    status: tab === 'cuisine' ? status : undefined,
  });
  const places = useCulinaryPlaces(canManage, {
    q: q || undefined,
    type,
    operational_status: operational,
    status: tab === 'place' ? status : undefined,
  });
  const categories = useCulinaryCategories(canManage);
  const pending = usePendingCulinaryContributions(canManage);
  const reviewMutation = useReviewCulinaryContribution();

  const createCuisine = useCreateCuisine();
  const updateCuisine = useUpdateCuisine();
  const deleteCuisine = useDeleteCuisine();
  const restrictCuisine = useRestrictCuisine();
  const restoreCuisine = useRestoreCuisine();

  const createPlace = useCreatePlace();
  const updatePlace = useUpdatePlace();
  const deletePlace = useDeletePlace();
  const restrictPlace = useRestrictPlace();
  const restorePlace = useRestorePlace();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState<Cuisine | null>(null);
  const [editingPlace, setEditingPlace] = useState<CulinaryPlace | null>(null);
  const [proposal, setProposal] = useState<CulinaryContribution | null>(null);
  const [duplicate, setDuplicate] = useState<
    { kind: 'cuisine' | 'place'; id: string; name: string } | null
  >(null);

  const restrictedToggle = async (
    kind: 'cuisine' | 'place',
    row: { id: string; publishStatus: CulinaryPublishStatus },
  ) => {
    const blocked = row.publishStatus === 'restricted' || row.publishStatus === 'archived';
    try {
      if (blocked) {
        if (kind === 'cuisine') await restoreCuisine.mutateAsync(row.id);
        else await restorePlace.mutateAsync(row.id);
        message.success(kind === 'cuisine' ? 'Kuliner dipulihkan' : 'Tempat dipulihkan');
      } else {
        const reason = window.prompt(
          'Alasan pembatasan (dilihat admin lain):',
          'Laporan masyarakat valid',
        );
        if (!reason || reason.trim().length < 3) return;
        if (kind === 'cuisine') {
          await restrictCuisine.mutateAsync({ id: row.id, reason: reason.trim() });
        } else {
          await restrictPlace.mutateAsync({ id: row.id, reason: reason.trim() });
        }
        message.success(kind === 'cuisine' ? 'Kuliner dibatasi' : 'Tempat dibatasi');
      }
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const cuisineColumns = useMemo(
    () =>
      cuisineHelper.columns([
        cuisineHelper.accessor('name', {
          header: 'Nama',
          size: 240,
          cell: (info) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{info.getValue()}</Typography.Text>
              <Typography.Text type="secondary">{info.row.original.slug}</Typography.Text>
            </Space>
          ),
        }),
        cuisineHelper.accessor('category', {
          header: 'Kategori',
          size: 150,
          cell: (info) => <Tag>{info.getValue()?.name ?? '-'}</Tag>,
        }),
        cuisineHelper.accessor('originRegion', {
          header: 'Daerah asal',
          size: 140,
          cell: (info) => info.getValue() ?? '-',
        }),
        cuisineHelper.display({
          id: 'images',
          header: 'Gambar',
          size: 100,
          cell: (info) => {
            const images = info.row.original.images;
            const missingAttr = images.some(
              (img) => !img.attribution?.name || !img.attribution?.license,
            );
            if (images.length === 0) {
              return <Typography.Text type="secondary">-</Typography.Text>;
            }
            return (
              <Space direction="vertical" size={0}>
                <Typography.Text>{images.length} gambar</Typography.Text>
                {missingAttr ? <Tag color="orange">Atribusi kurang</Tag> : null}
              </Space>
            );
          },
        }),
        cuisineHelper.accessor('publishStatus', {
          header: 'Publikasi',
          size: 120,
          cell: (info) => {
            const s = info.getValue();
            return <Tag color={PUBLISH_COLOR[s]}>{s}</Tag>;
          },
        }),
        cuisineHelper.accessor('updatedAt', {
          header: 'Diperbarui',
          size: 160,
          cell: (info) => formatDateTime(info.getValue() ?? info.row.original.createdAt),
        }),
        cuisineHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 160,
          meta: { fixed: 'right' },
          cell: (info) => {
            const row = info.row.original;
            const blocked =
              row.publishStatus === 'restricted' || row.publishStatus === 'archived';
            return (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingCuisine(row);
                      setDrawerOpen(true);
                    }}
                  />
                </Tooltip>
                <Tooltip title={blocked ? 'Pulihkan (tayang lagi)' : 'Batasi sementara'}>
                  <Button
                    type="link"
                    icon={blocked ? <UndoOutlined /> : <StopOutlined />}
                    onClick={() => void restrictedToggle('cuisine', row)}
                  />
                </Tooltip>
                <Tooltip title="Cek duplikat">
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setDuplicate({ kind: 'cuisine', id: row.id, name: row.name })}
                  />
                </Tooltip>
                <Popconfirm
                  title="Hapus kuliner ini?"
                  description="Soft delete - hilang dari app publik."
                  onConfirm={async () => {
                    try {
                      await deleteCuisine.mutateAsync(row.id);
                      message.success('Kuliner dihapus');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteCuisine, message, restoreCuisine, restrictCuisine],
  );

  const placeColumns = useMemo(
    () =>
      placeHelper.columns([
        placeHelper.accessor('name', {
          header: 'Nama',
          size: 240,
          cell: (info) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{info.getValue()}</Typography.Text>
              <Typography.Text type="secondary">{info.row.original.slug}</Typography.Text>
            </Space>
          ),
        }),
        placeHelper.accessor('type', {
          header: 'Jenis',
          size: 150,
          cell: (info) => {
            const t = info.getValue();
            return <Tag>{t ? PLACE_TYPE_LABEL[t] : '-'}</Tag>;
          },
        }),
        placeHelper.accessor('addressText', {
          header: 'Alamat',
          size: 220,
          cell: (info) => (
            <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
              {info.getValue() ?? info.row.original.locationHint ?? '-'}
            </Typography.Paragraph>
          ),
        }),
        placeHelper.accessor('operationalStatus', {
          header: 'Operasional',
          size: 150,
          cell: (info) => {
            const s = info.getValue();
            return <Tag color={OPERATIONAL_COLOR[s]}>{OPERATIONAL_LABEL[s]}</Tag>;
          },
        }),
        placeHelper.accessor('publishStatus', {
          header: 'Publikasi',
          size: 120,
          cell: (info) => {
            const s = info.getValue();
            return <Tag color={PUBLISH_COLOR[s]}>{s}</Tag>;
          },
        }),
        placeHelper.display({
          id: 'manager',
          header: 'Pengelola',
          size: 130,
          cell: (info) =>
            info.row.original.managerId ? (
              <Tag color="blue">Terverifikasi</Tag>
            ) : (
              <Typography.Text type="secondary">-</Typography.Text>
            ),
        }),
        placeHelper.accessor('updatedAt', {
          header: 'Diperbarui',
          size: 160,
          cell: (info) => formatDateTime(info.getValue() ?? info.row.original.createdAt),
        }),
        placeHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 160,
          meta: { fixed: 'right' },
          cell: (info) => {
            const row = info.row.original;
            const blocked =
              row.publishStatus === 'restricted' || row.publishStatus === 'archived';
            return (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingPlace(row);
                      setDrawerOpen(true);
                    }}
                  />
                </Tooltip>
                <Tooltip title={blocked ? 'Pulihkan (tayang lagi)' : 'Batasi sementara'}>
                  <Button
                    type="link"
                    icon={blocked ? <UndoOutlined /> : <StopOutlined />}
                    onClick={() => void restrictedToggle('place', row)}
                  />
                </Tooltip>
                <Tooltip title="Cek duplikat">
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setDuplicate({ kind: 'place', id: row.id, name: row.name })}
                  />
                </Tooltip>
                <Popconfirm
                  title="Hapus tempat ini?"
                  description="Soft delete - hilang dari app publik."
                  onConfirm={async () => {
                    try {
                      await deletePlace.mutateAsync(row.id);
                      message.success('Tempat dihapus');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deletePlace, message, restorePlace, restrictPlace],
  );

  const activeList = tab === 'cuisine' ? cuisines : places;

  const cuisineTable = useTable({
    features: tableFeatureSet,
    data: cuisines.items,
    columns: cuisineColumns,
    getRowId: (row) => row.id,
    manualPagination: true,
  });

  const placeTable = useTable({
    features: tableFeatureSet,
    data: places.items,
    columns: placeColumns,
    getRowId: (row) => row.id,
    manualPagination: true,
  });

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin, root, atau reviewer yang bisa mengelola kuliner.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Kuliner"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void activeList.refetch()}>
              Muat ulang
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCuisine(null);
                setEditingPlace(null);
                setDrawerOpen(true);
              }}
            >
              {tab === 'cuisine' ? 'Kuliner baru' : 'Tempat baru'}
            </Button>
          </Space>
        }
      />

      <PendingProposals rows={pending.data ?? []} onPreview={setProposal} />

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as 'cuisine' | 'place')}
        items={[
          { key: 'cuisine', label: 'Kuliner' },
          { key: 'place', label: 'Tempat' },
        ]}
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Cari nama / slug"
          allowClear
          onSearch={setQ}
          style={{ width: 240 }}
        />
        {tab === 'cuisine' ? (
          <Select
            allowClear
            placeholder="Kategori"
            style={{ width: 170 }}
            onChange={(v) => setCategory(v)}
            options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
        ) : (
          <>
            <Select
              allowClear
              placeholder="Jenis tempat"
              style={{ width: 170 }}
              onChange={(v) => setType(v)}
              options={CULINARY_PLACE_TYPE_OPTIONS}
            />
            <Select
              allowClear
              placeholder="Operasional"
              style={{ width: 180 }}
              onChange={(v) => setOperational(v)}
              options={CULINARY_OPERATIONAL_STATUS_OPTIONS}
            />
          </>
        )}
        <Select
          allowClear
          placeholder="Publikasi"
          style={{ width: 150 }}
          onChange={(v) => setStatus(v)}
          options={CULINARY_PUBLISH_STATUS_OPTIONS}
        />
      </Space>

      {activeList.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat data kuliner"
          description={normalizeError(activeList.error).message}
        />
      ) : null}

      {tab === 'cuisine' ? (
        <DataTable
          table={cuisineTable}
          rowKey={(record) => record.id}
          loading={cuisines.isLoading || (cuisines.isFetching && cuisines.items.length === 0)}
        />
      ) : (
        <DataTable
          table={placeTable}
          rowKey={(record) => record.id}
          loading={places.isLoading || (places.isFetching && places.items.length === 0)}
        />
      )}

      <Flex justify="center" align="center" gap={16} style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{activeList.items.length} entri dimuat</Typography.Text>
        {activeList.hasMore ? (
          <Button onClick={() => activeList.loadMore()} loading={activeList.isFetchingNextPage}>
            Muat lagi
          </Button>
        ) : null}
      </Flex>

      <CulinaryProposalDrawer
        proposal={proposal}
        onClose={() => setProposal(null)}
        onReviewed={() => {
          void pending.refetch();
          void cuisines.refetch();
          void places.refetch();
        }}
        review={(params) => reviewMutation.mutateAsync(params)}
      />

      <CuisineDrawer
        open={drawerOpen && tab === 'cuisine'}
        editing={editingCuisine}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => void cuisines.refetch()}
        submit={async (values) => {
          if ('id' in values && values.id) {
            const { id, ...body } = values;
            return updateCuisine.mutateAsync({ id, ...body });
          }
          return createCuisine.mutateAsync(values as CuisineInput);
        }}
      />

      <PlaceDrawer
        open={drawerOpen && tab === 'place'}
        editing={editingPlace}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => void places.refetch()}
        submit={async (values) => {
          if ('id' in values && values.id) {
            const { id, ...body } = values;
            return updatePlace.mutateAsync({ id, ...body });
          }
          return createPlace.mutateAsync(values as PlaceInput);
        }}
      />

      {duplicate ? (
        <DuplicateHints kind={duplicate.kind} target={duplicate} onClose={() => setDuplicate(null)} />
      ) : null}
    </>
  );
}
