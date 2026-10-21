import { useMemo, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import type { PlaceCategoryItem } from '../domain/place-category';
import {
  useAllPlaceCategories,
  useCreatePlaceCategory,
  useDeletePlaceCategory,
  useUpdatePlaceCategory,
} from '../application/use-place-categories';

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
  id: string;
  name: string;
  sort_order?: number;
  status: PlaceCategoryItem['status'];
}

export function PlaceCategoriesPage() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';
  const { message } = AntdApp.useApp();
  const list = useAllPlaceCategories(canManage);
  const createMutation = useCreatePlaceCategory();
  const updateMutation = useUpdatePlaceCategory();
  const deleteMutation = useDeletePlaceCategory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PlaceCategoryItem | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  const items = useMemo(
    () => [...(list.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id')),
    [list.data],
  );

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ id: '', name: '', sort_order: items.length, status: 'published' });
    setDrawerOpen(true);
  };

  const openEdit = (row: PlaceCategoryItem) => {
    setEditing(row);
    form.setFieldsValue({
      id: row.id,
      name: row.name,
      sort_order: row.sortOrder,
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
          sort_order: values.sort_order,
          status: values.status,
        });
        message.success('Kategori diperbarui');
      } else {
        await createMutation.mutateAsync({
          id: values.id.trim() || slugify(values.name),
          name: values.name.trim(),
          sort_order: values.sort_order,
          status: values.status,
        });
        message.success('Kategori dibuat');
      }
      setDrawerOpen(false);
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return <Typography.Text type="secondary">Hanya admin/reviewer yang bisa mengelola kategori tempat.</Typography.Text>;
  }

  return (
    <>
      <PageHeader
        title="Kategori tempat"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void list.refetch()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Kategori baru
            </Button>
          </Space>
        }
      />
      <Table
        rowKey="id"
        loading={list.isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          { title: 'Id', dataIndex: 'id', width: 160 },
          { title: 'Nama', dataIndex: 'name' },
          { title: 'Urutan', dataIndex: 'sortOrder', width: 90 },
          { title: 'Status', dataIndex: 'status', width: 120 },
          {
            title: '',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button size="small" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Hapus kategori ini?"
                  okText="Hapus"
                  cancelText="Batal"
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Kategori dihapus');
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  <Button size="small" danger>
                    Hapus
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Drawer
        title={editing ? 'Edit kategori' : 'Kategori baru'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
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
          <Form.Item name="name" label="Nama" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input
              onBlur={(e) => {
                if (!editing && !form.getFieldValue('id')) {
                  form.setFieldValue('id', slugify(e.target.value));
                }
              }}
            />
          </Form.Item>
          <Form.Item name="id" label="Id (slug)" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input disabled={!!editing} placeholder="mis. religi" />
          </Form.Item>
          <Form.Item name="sort_order" label="Urutan">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
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
