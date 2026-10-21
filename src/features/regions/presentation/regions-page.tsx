import { useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UnorderedListOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Breadcrumb,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { MapPointField } from '@/shared/map/map-point-field';
import { SAMBAS_BIAS, SAMBAS_CENTER } from '@/shared/map/presets';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import type { Region } from '../domain/region';
import {
  useAllRegions,
  useCreateRegion,
  useDeleteRegion,
  useUpdateRegion,
} from '../application/use-regions';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

interface FormValues {
  slug: string;
  name: string;
  code?: string;
  lat?: number | null;
  lng?: number | null;
  status: Region['status'];
}

export function RegionsPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';
  const { message } = AntdApp.useApp();
  const list = useAllRegions(canManage);
  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();
  const deleteMutation = useDeleteRegion();
  const [kecamatanId, setKecamatanId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [creatingDesa, setCreatingDesa] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  const items = list.data ?? [];
  const kecamatan = useMemo(
    () => items.filter((r) => r.type === 'kecamatan').sort((a, b) => a.name.localeCompare(b.name, 'id')),
    [items],
  );
  const desa = useMemo(
    () =>
      items
        .filter((r) => r.type === 'desa' && r.parentId === kecamatanId)
        .sort((a, b) => a.name.localeCompare(b.name, 'id')),
    [items, kecamatanId],
  );
  const selectedKec = kecamatan.find((k) => k.id === kecamatanId) ?? null;

  const openCreateKecamatan = () => {
    setEditing(null);
    setCreatingDesa(false);
    form.setFieldsValue({
      slug: '',
      name: '',
      code: undefined,
      lat: null,
      lng: null,
      status: 'published',
    });
    setDrawerOpen(true);
  };

  const openCreateDesa = () => {
    if (!kecamatanId) return;
    setEditing(null);
    setCreatingDesa(true);
    form.setFieldsValue({
      slug: '',
      name: '',
      code: undefined,
      lat: null,
      lng: null,
      status: 'published',
    });
    setDrawerOpen(true);
  };

  const openEdit = (row: Region) => {
    setEditing(row);
    setCreatingDesa(row.type === 'desa');
    form.setFieldsValue({
      slug: row.slug,
      name: row.name,
      code: row.code ?? undefined,
      lat: row.lat,
      lng: row.lng,
      status: row.status,
    });
    setDrawerOpen(true);
  };

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name: values.name.trim(),
          code: values.code?.trim() || null,
          lat: values.lat ?? null,
          lng: values.lng ?? null,
          status: values.status,
        });
        message.success('Wilayah diperbarui');
      } else if (creatingDesa && kecamatanId && selectedKec) {
        const leaf = slugify(values.name);
        await createMutation.mutateAsync({
          slug: `${selectedKec.slug}/${leaf}`,
          name: values.name.trim(),
          type: 'desa',
          parent_id: kecamatanId,
          code: values.code?.trim() || null,
          lat: values.lat ?? null,
          lng: values.lng ?? null,
          status: values.status,
        });
        message.success('Desa dibuat');
      } else {
        await createMutation.mutateAsync({
          slug: slugify(values.name),
          name: values.name.trim(),
          type: 'kecamatan',
          parent_id: null,
          lat: values.lat ?? null,
          lng: values.lng ?? null,
          status: values.status,
        });
        message.success('Kecamatan dibuat');
      }
      setDrawerOpen(false);
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Region) => {
    try {
      await deleteMutation.mutateAsync(row.id);
      message.success('Wilayah dihapus');
      if (row.id === kecamatanId) setKecamatanId(null);
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin, root, atau reviewer yang bisa mengelola wilayah.
      </Typography.Text>
    );
  }

  const crumbs = [
    {
      title: kecamatanId ? (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setKecamatanId(null)}>
          Kecamatan
        </Button>
      ) : (
        'Kecamatan'
      ),
    },
  ];
  if (selectedKec) crumbs.push({ title: selectedKec.name });

  const drawerTitle = editing
    ? `Edit ${editing.type}`
    : creatingDesa
      ? 'Desa baru'
      : 'Kecamatan baru';

  return (
    <>
      <PageHeader
        title="Wilayah"
        subtitle="Kelola kecamatan dan desa. Dipakai sebagai referensi form wisata."
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Muat ulang
            </Button>
            {kecamatanId ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDesa}>
                Desa baru
              </Button>
            ) : (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateKecamatan}>
                Kecamatan baru
              </Button>
            )}
          </Space>
        }
      />

      <Breadcrumb style={{ margin: '12px 0 16px' }} items={crumbs} />

      {list.isError ? (
        <Typography.Text type="danger">{normalizeError(list.error).message}</Typography.Text>
      ) : null}

      {!kecamatanId ? (
        <Table<Region>
          rowKey="id"
          loading={list.isLoading}
          dataSource={kecamatan}
          pagination={false}
          columns={[
            { title: 'Nama', dataIndex: 'name' },
            { title: 'Slug', dataIndex: 'slug', width: 180 },
            {
              title: 'Desa',
              key: 'desa',
              width: 90,
              render: (_: unknown, row) => items.filter((r) => r.parentId === row.id).length,
            },
            {
              title: 'Aksi',
              key: 'actions',
              width: 120,
              render: (_: unknown, row) => (
                <Space size={0}>
                  <Tooltip title="Desa">
                    <Button type="link" icon={<UnorderedListOutlined />} onClick={() => setKecamatanId(row.id)} />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                  </Tooltip>
                  <Popconfirm
                    title="Hapus kecamatan ini?"
                    description="Gagal kalau masih ada desa atau wisata yang memakai id ini."
                    onConfirm={() => remove(row)}
                  >
                    <Tooltip title="Hapus">
                      <Button type="link" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      ) : (
        <Table<Region>
          rowKey="id"
          loading={list.isLoading}
          dataSource={desa}
          pagination={false}
          columns={[
            { title: 'Nama', dataIndex: 'name' },
            { title: 'Slug', dataIndex: 'slug', width: 260 },
            {
              title: 'Kode BPS',
              dataIndex: 'code',
              width: 140,
              render: (v: string | null) => v ?? '-',
            },
            {
              title: 'Aksi',
              key: 'actions',
              width: 100,
              render: (_: unknown, row) => (
                <Space size={0}>
                  <Tooltip title="Edit">
                    <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                  </Tooltip>
                  <Popconfirm
                    title="Hapus desa ini?"
                    description="Gagal kalau masih ada wisata yang memakai id ini."
                    onConfirm={() => remove(row)}
                  >
                    <Tooltip title="Hapus">
                      <Button type="link" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      )}

      <Drawer
        title={drawerTitle}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={640}
        destroyOnClose
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Batal</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Simpan
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {editing ? (
            <Form.Item name="slug" label="Slug">
              <Input disabled />
            </Form.Item>
          ) : null}
          <Form.Item name="name" label="Nama" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input />
          </Form.Item>
          {creatingDesa || editing?.type === 'desa' ? (
            <Form.Item name="code" label="Kode BPS (10 digit)">
              <Input maxLength={10} />
            </Form.Item>
          ) : null}
          <Typography.Text>Lokasi</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <MapPointField defaultCenter={SAMBAS_CENTER} bias={SAMBAS_BIAS} height={280} />
          </div>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
