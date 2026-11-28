import { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Drawer, Form, Input, InputNumber, Select, Space, Tag, Typography } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import {
  LAYANAN_CATEGORY_ICON_OPTIONS,
  type LayananCategoryItem,
  type LayananCategoryStatus,
  useAllLayananCategoryItems,
  useCreateLayananCategoryItem,
  useDeleteLayananCategoryItem,
  useUpdateLayananCategoryItem,
} from '../application/use-layanan-categories';

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
  short_label: string;
  icon: string;
  sort_order?: number;
  status: LayananCategoryStatus;
}

export function LayananCategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';
  const { message } = AntdApp.useApp();
  const list = useAllLayananCategoryItems(canManage);
  const createMutation = useCreateLayananCategoryItem();
  const updateMutation = useUpdateLayananCategoryItem();
  const deleteMutation = useDeleteLayananCategoryItem();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LayananCategoryItem | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        id: editing.id,
        name: editing.name,
        short_label: editing.shortLabel,
        icon: editing.icon,
        sort_order: editing.sortOrder,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'published', sort_order: 0, icon: 'siren' });
    }
  }, [open, editing, form]);

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name: values.name.trim(),
          short_label: values.short_label.trim(),
          icon: values.icon,
          sort_order: values.sort_order,
          status: values.status,
        });
        message.success('Kategori diperbarui');
      } else {
        await createMutation.mutateAsync({
          id: values.id.trim() || slugify(values.name),
          name: values.name.trim(),
          short_label: values.short_label.trim(),
          icon: values.icon,
          sort_order: values.sort_order,
          status: values.status,
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

  const items = [...(list.data ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id'),
  );

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/reviewer yang bisa mengelola kategori layanan.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Kategori layanan"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void list.refetch()}>
              Muat ulang
            </Button>
            <Button
              type="primary"
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

      <Typography.Paragraph type="secondary">
        Arsipkan kategori yang tidak boleh dipakai lagi. Layanan lama tetap tampil; kategori arsip tidak bisa dipilih
        untuk layanan atau usulan baru. Kategori yang masih dipakai layanan tidak bisa dihapus.
      </Typography.Paragraph>

      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {items.map((row) => (
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
              <Space>
                <Typography.Text strong>{row.name}</Typography.Text>
                <Tag>{row.shortLabel}</Tag>
                {row.status === 'archived' ? <Tag color="default">Diarsipkan</Tag> : null}
              </Space>
              <Typography.Text type="secondary">
                {row.id} - ikon {row.icon} - urutan {row.sortOrder}
              </Typography.Text>
            </Space>
            <Space>
              <Button
                size="small"
                onClick={() => {
                  setEditing(row);
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                loading={deleteMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(row.id);
                    message.success('Kategori dihapus');
                  } catch (err) {
                    message.error(normalizeError(err).message);
                  }
                }}
              >
                Hapus
              </Button>
            </Space>
          </Space>
        ))}
      </Space>

      <Drawer
        title={editing ? 'Edit kategori' : 'Kategori baru'}
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpen(false)}>Batal</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Simpan
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Nama lengkap" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input
              onBlur={(e) => {
                if (!editing && !form.getFieldValue('id')) {
                  form.setFieldValue('id', slugify(e.target.value));
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="short_label"
            label="Label singkat (chip)"
            rules={[{ required: true, message: 'Wajib diisi' }]}
            extra="Dipakai di chip filter. Harus unik di antara kategori aktif."
          >
            <Input maxLength={20} placeholder="mis. Damkar" />
          </Form.Item>
          <Form.Item name="id" label="Id (slug)" rules={[{ required: true, message: 'Wajib diisi' }]} extra="Tidak bisa diubah setelah dibuat.">
            <Input disabled={!!editing} placeholder="mis. pmi" />
          </Form.Item>
          <Form.Item name="icon" label="Ikon" rules={[{ required: true }]}>
            <Select options={LAYANAN_CATEGORY_ICON_OPTIONS} />
          </Form.Item>
          <Form.Item name="sort_order" label="Urutan">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'published', label: 'Aktif' },
                { value: 'archived', label: 'Diarsipkan' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
