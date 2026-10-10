import { useMemo, useState } from 'react';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  Form,
  Input,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import type { Category } from '../domain/category';
import { useCategoryList, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../application/use-category-crud';

interface FormValues {
  name: string;
  description?: string;
  parent_id?: string;
}

/** Kelola kategori master (admin console). */
export function CategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const list = useCategoryList(canManage);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => list.data ?? [], [list.data]);

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola kategori.
      </Typography.Text>
    );
  }

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (row: Category) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      description: row.description ?? '',
      parent_id: row.parent_id ?? '',
    });
    setModalOpen(true);
  };

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name: values.name.trim(),
          description: values.description?.trim() || null,
          parent_id: values.parent_id?.trim() || null,
        });
        message.success('Kategori diperbarui');
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          description: values.description?.trim() || null,
          parent_id: values.parent_id?.trim() || null,
        });
        message.success('Kategori dibuat');
      }
      setModalOpen(false);
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Kategori"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Muat ulang
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Kategori baru
            </Button>
          </Space>
        }
      />

      {list.isError ? (
        <Typography.Text type="danger">{normalizeError(list.error).message}</Typography.Text>
      ) : null}

      <Table<Category>
        rowKey="id"
        loading={list.isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          {
            title: 'Nama',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Deskripsi',
            dataIndex: 'description',
            key: 'description',
            render: (text: unknown) => text ?? <Typography.Text type="secondary">-</Typography.Text>,
          },
          {
            title: 'Jumlah kata',
            dataIndex: 'word_count',
            key: 'word_count',
            width: 120,
            align: 'right',
          },
          {
            title: 'Parent',
            dataIndex: 'parent_id',
            key: 'parent_id',
            width: 150,
            render: (text: unknown) => text ?? <Typography.Text type="secondary">-</Typography.Text>,
          },
          {
            title: '',
            key: 'ops',
            width: 200,
            render: (_: unknown, row: Category) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Hapus kategori?"
                  description="Kategori akan di-soft-delete. Kata yang berkategori tetap tidak terpengaruh."
                  okText="Hapus"
                  okButtonProps={{ danger: true }}
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Kategori dihapus');
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    Hapus
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      {items.length === 0 && !list.isLoading ? (
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
          Belum ada kategori. Klik "Kategori baru" untuk membuat.
        </Typography.Text>
      ) : null}

      <Modal
        title={editing ? 'Edit kategori' : 'Kategori baru'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="primary" form="category-form" htmlType="submit" loading={saving}>
              {editing ? 'Simpan' : 'Buat'}
            </Button>
          </Space>
        }
      >
        <Form
          id="category-form"
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            name="name"
            label="Nama"
            rules={[
              { required: true, message: 'Wajib diisi' },
              { max: 60, message: 'Maks 60 karakter' },
            ]}
          >
            <Input placeholder="Mis. Makanan & Minuman" />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi (opsional)">
            <Input.TextArea rows={3} placeholder="Deskripsi kategori" />
          </Form.Item>
          <Form.Item name="parent_id" label="Parent ID (opsional)">
            <Input placeholder="ULID parent kategori" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}