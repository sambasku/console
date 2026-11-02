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
  Usaha,
  UsahaContribution,
  UsahaPublishStatus,
  UsahaOperationalStatus,
} from '../domain/usaha';
import type { UsahaInput } from '../infrastructure/usaha-api';
import {
  useCreateUsaha,
  useDeleteUsaha,
  usePendingUsahaContributions,
  useRestoreUsaha,
  useRestrictUsaha,
  useReviewUsahaContribution,
  useUpdateUsaha,
  useUsahaCategories,
  useUsahaDuplicates,
  useUsahaList,
} from '../application/use-usaha';
import { useAllRegions } from '@/features/regions/application/use-regions';
import {
  USAHA_OPERATIONAL_STATUS_OPTIONS,
  USAHA_PUBLISH_STATUS_OPTIONS,
  UsahaDrawer,
} from './usaha-drawer';
import { UsahaProposalDrawer } from './usaha-proposal-drawer';

const columnHelper = createColumnHelper<typeof tableFeatureSet, Usaha>();

const PUBLISH_COLOR: Record<UsahaPublishStatus, string> = {
  published: 'green',
  draft: 'gold',
  archived: 'default',
  restricted: 'red',
};

const OPERATIONAL_LABEL: Record<UsahaOperationalStatus, string> = {
  unknown: 'Belum diketahui',
  open: 'Buka',
  temporarily_closed: 'Tutup sementara',
  permanently_closed: 'Tutup permanen',
};

const OPERATIONAL_COLOR: Record<UsahaOperationalStatus, string> = {
  unknown: 'default',
  open: 'green',
  temporarily_closed: 'orange',
  permanently_closed: 'red',
};

function PendingProposals({
  rows,
  onPreview,
}: {
  rows: UsahaContribution[];
  onPreview: (row: UsahaContribution) => void;
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
                {String(row.payload.name ?? row.usahaName ?? 'Pengajuan')}
              </Typography.Text>
              <Typography.Text type="secondary">
                {row.kind} - {formatDateTime(row.createdAt)}
                {row.usahaSlug ? ` - ${row.usahaSlug}` : ''}
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

function DuplicateHints({ usaha, onClose }: { usaha: Usaha; onClose: () => void }) {
  const duplicates = useUsahaDuplicates(usaha.id);
  const rows = duplicates.data ?? [];
  return (
    <Modal
      title={`Usaha mirip dengan ${usaha.name}`}
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
            {d.name} ({d.slug}){d.phone ? ` - ${d.phone}` : ''}
          </Typography.Text>
        ))}
      </Space>
    </Modal>
  );
}

export function UsahaPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';
  const { message } = AntdApp.useApp();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<UsahaPublishStatus | undefined>();
  const [operational, setOperational] = useState<UsahaOperationalStatus | undefined>();
  const [region, setRegion] = useState<string | undefined>();

  const list = useUsahaList(canManage, {
    q: q || undefined,
    category_id: category,
    status,
    operational_status: operational,
    region_id: region,
  });
  const regions = useAllRegions(canManage);
  const categories = useUsahaCategories(canManage);
  const pending = usePendingUsahaContributions(canManage);
  const createMutation = useCreateUsaha();
  const updateMutation = useUpdateUsaha();
  const deleteMutation = useDeleteUsaha();
  const restrictMutation = useRestrictUsaha();
  const restoreMutation = useRestoreUsaha();
  const reviewMutation = useReviewUsahaContribution();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Usaha | null>(null);
  const [proposal, setProposal] = useState<UsahaContribution | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Usaha | null>(null);

  const regionName = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of regions.data ?? []) map.set(r.id, r.name);
    return (id: string | null) => (id ? (map.get(id) ?? id) : '-');
  }, [regions.data]);

  const kecamatanOptions = (regions.data ?? [])
    .filter((r) => r.type === 'kecamatan')
    .map((r) => ({ value: r.id, label: r.name }));

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
        columnHelper.accessor('category', {
          header: 'Kategori',
          size: 140,
          cell: (info) => <Tag>{info.getValue()?.name ?? '-'}</Tag>,
        }),
        columnHelper.display({
          id: 'wilayah',
          header: 'Wilayah',
          size: 180,
          cell: (info) => {
            const row = info.row.original;
            return (
              <Space direction="vertical" size={0}>
                <Typography.Text>{regionName(row.regionId)}</Typography.Text>
                <Typography.Text type="secondary">{row.village?.name ?? '-'}</Typography.Text>
              </Space>
            );
          },
        }),
        columnHelper.accessor('operationalStatus', {
          header: 'Operasional',
          size: 150,
          cell: (info) => {
            const s = info.getValue();
            return <Tag color={OPERATIONAL_COLOR[s]}>{OPERATIONAL_LABEL[s]}</Tag>;
          },
        }),
        columnHelper.accessor('publishStatus', {
          header: 'Publikasi',
          size: 120,
          cell: (info) => {
            const s = info.getValue();
            return <Tag color={PUBLISH_COLOR[s]}>{s}</Tag>;
          },
        }),
        columnHelper.display({
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
        columnHelper.accessor('updatedAt', {
          header: 'Diperbarui',
          size: 160,
          cell: (info) => formatDateTime(info.getValue() ?? info.row.original.createdAt),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 160,
          meta: { fixed: 'right' },
          cell: (info) => {
            const row = info.row.original;
            const blocked = row.publishStatus === 'restricted' || row.publishStatus === 'archived';
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
                <Tooltip title={blocked ? 'Pulihkan (tayang lagi)' : 'Batasi sementara'}>
                  <Button
                    type="link"
                    icon={blocked ? <UndoOutlined /> : <StopOutlined />}
                    onClick={async () => {
                      try {
                        if (blocked) {
                          await restoreMutation.mutateAsync(row.id);
                          message.success('Usaha dipulihkan');
                        } else {
                          const reason = window.prompt(
                            'Alasan pembatasan (dilihat admin lain):',
                            'Laporan masyarakat valid',
                          );
                          if (!reason || reason.trim().length < 3) return;
                          await restrictMutation.mutateAsync({
                            id: row.id,
                            reason: reason.trim(),
                          });
                          message.success('Usaha dibatasi');
                        }
                      } catch (err) {
                        message.error(normalizeError(err).message);
                      }
                    }}
                  />
                </Tooltip>
                <Tooltip title="Cek duplikat">
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setDuplicateTarget(row)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Hapus usaha ini?"
                  description="Soft delete - hilang dari app publik."
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Usaha dihapus');
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
    [deleteMutation, duplicateTarget, message, regionName, restoreMutation, restrictMutation],
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
        Hanya admin, root, atau reviewer yang bisa mengelola usaha.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Usaha"
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
              Usaha baru
            </Button>
          </Space>
        }
      />

      <PendingProposals rows={pending.data ?? []} onPreview={setProposal} />

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
          style={{ width: 170 }}
          onChange={(v) => setCategory(v)}
          options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          allowClear
          placeholder="Wilayah"
          showSearch
          optionFilterProp="label"
          style={{ width: 190 }}
          onChange={(v) => setRegion(v)}
          options={kecamatanOptions}
        />
        <Select
          allowClear
          placeholder="Publikasi"
          style={{ width: 150 }}
          onChange={(v) => setStatus(v)}
          options={USAHA_PUBLISH_STATUS_OPTIONS}
        />
        <Select
          allowClear
          placeholder="Operasional"
          style={{ width: 180 }}
          onChange={(v) => setOperational(v)}
          options={USAHA_OPERATIONAL_STATUS_OPTIONS}
        />
      </Space>

      {list.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat usaha"
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

      <UsahaProposalDrawer
        proposal={proposal}
        onClose={() => setProposal(null)}
        onReviewed={() => {
          void pending.refetch();
          void list.refetch();
        }}
        review={(params) => reviewMutation.mutateAsync(params)}
      />

      <UsahaDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => void list.refetch()}
        submit={async (values) => {
          if ('id' in values && values.id) {
            const { id, ...body } = values;
            return updateMutation.mutateAsync({ id, ...body });
          }
          return createMutation.mutateAsync(values as UsahaInput);
        }}
      />

      {duplicateTarget ? (
        <DuplicateHints
          usaha={duplicateTarget}
          onClose={() => setDuplicateTarget(null)}
        />
      ) : null}
    </>
  );
}
