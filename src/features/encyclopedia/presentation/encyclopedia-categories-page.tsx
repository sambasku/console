import { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listCategoriesRequest,
  createCategoryRequest,
  updateCategoryRequest,
} from '../infrastructure/encyclopedia-api';
import {
  ARTICLE_STATUS_COLOR,
  ARTICLE_STATUS_LABEL,
  type EncyclopediaCategoryItem,
} from '../domain/encyclopedia';

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
  status: EncyclopediaCategoryItem['status'];
}

export function EncyclopediaCategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['encyclopedia', 'categories-admin'],
    queryFn: ({ signal }) => listCategoriesRequest(signal),
  });

  const createMutation = useMutation({
    mutationFn: (body: { id: string; name: string; sort_order?: number }) => createCategoryRequest(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; status?: 'draft' | 'published' | 'archived'; sort_order?: number }) =>
      updateCategoryRequest(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'categories'] });
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EncyclopediaCategoryItem | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        id: editing.id,
        name: editing.name,
        sort_order: editing.sort_order,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'published', sort_order: 100 });
    }
  }, [editing, form, open]);

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
        });
        message.success('Kategori dibuat');
      }
      setOpen(false);
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const items = [...(query.data ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'id'),
  );

  return (
    <>
      <PageHeader
        title="Kategori Ensiklopedia"
        subtitle="Kelola taksonomi kategori induk artikel ensiklopedia."
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              Muat ulang
            </Button>
            <Button
              type="primary"
              disabled={!canManage}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Kategori baru
            </Button>
          </Space>
        }
      />

      <Table<EncyclopediaCategoryItem>
        rowKey="id"
        loading={query.isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          {
            title: 'Nama Kategori',
            key: 'name',
            render: (_, row) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{row.name}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  id: {row.id}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: 'Urutan',
            dataIndex: 'sort_order',
            key: 'sort_order',
            width: 100,
          },
          {
            title: 'Status',
            key: 'status',
            width: 120,
            render: (_, row) => (
              <Tag color={ARTICLE_STATUS_COLOR[row.status]}>{ARTICLE_STATUS_LABEL[row.status]}</Tag>
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_, row) => (
              <Button
                size="small"
                type="link"
                disabled={!canManage}
                onClick={() => {
                  setEditing(row);
                  setOpen(true);
                }}
              >
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title={editing ? 'Edit kategori' : 'Kategori baru'}
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="name"
            label="Nama Kategori"
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <Input
              placeholder="Mis. Budaya & Tradisi"
              onBlur={(e) => {
                if (!editing && !form.getFieldValue('id')) {
                  form.setFieldValue('id', slugify(e.target.value));
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="id"
            label="ID / Slug"
            extra="Huruf kecil, angka, dan hyphen"
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <Input disabled={!!editing} placeholder="mis. budaya-tradisi" />
          </Form.Item>

          <Form.Item name="sort_order" label="Urutan Tampil">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          {editing ? (
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'published', label: 'Tayang' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Diarsipkan' },
                ]}
              />
            </Form.Item>
          ) : null}

          <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => setOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Simpan
            </Button>
          </Space>
        </Form>
      </Drawer>
    </>
  );
}