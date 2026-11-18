import { useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Typography,
  Upload,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import type { Sticker } from '../domain/sticker';
import {
  useCreateSticker,
  useDeleteSticker,
  useStickerList,
  useUpdateSticker,
} from '../application/use-stickers';
import { uploadStickerImage } from '../infrastructure/sticker-api';

interface FormValues {
  id: string;
  image_url: string;
  play_once: boolean;
  sort_order: number;
  is_active: boolean;
}

export function StickersPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const list = useStickerList(canManage);
  const createMutation = useCreateSticker();
  const updateMutation = useUpdateSticker();
  const deleteMutation = useDeleteSticker();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sticker | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const items = useMemo(() => list.data ?? [], [list.data]);

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola stiker.
      </Typography.Text>
    );
  }

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      play_once: false,
      sort_order: (items.at(-1)?.sort_order ?? 0) + 10,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (row: Sticker) => {
    setEditing(row);
    form.setFieldsValue({
      id: row.id,
      image_url: row.image_url,
      play_once: row.play_once,
      sort_order: row.sort_order,
      is_active: row.is_active,
    });
    setModalOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadStickerImage(file);
      form.setFieldValue('image_url', url);
      message.success('Gambar stiker terunggah');
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          image_url: values.image_url.trim(),
          play_once: values.play_once,
          sort_order: values.sort_order,
          is_active: values.is_active,
        });
        message.success('Stiker diperbarui');
      } else {
        await createMutation.mutateAsync({
          id: values.id.trim().toLowerCase(),
          image_url: values.image_url.trim(),
          play_once: values.play_once,
          sort_order: values.sort_order,
          is_active: values.is_active,
        });
        message.success('Stiker ditambahkan');
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
        title="Stiker"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Muat ulang
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tambah
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
          {
            title: 'Preview',
            dataIndex: 'image_url',
            width: 88,
            render: (url: string) => (
              <img
                src={url}
                alt=""
                width={48}
                height={48}
                style={{ objectFit: 'contain' }}
              />
            ),
          },
          { title: 'Id', dataIndex: 'id' },
          {
            title: 'Play once',
            dataIndex: 'play_once',
            render: (v: boolean) => (v ? 'Ya' : 'Tidak'),
          },
          { title: 'Urutan', dataIndex: 'sort_order', width: 88 },
          {
            title: 'Aktif',
            dataIndex: 'is_active',
            render: (v: boolean) => (v ? 'Ya' : 'Tidak'),
          },
          {
            title: 'Aksi',
            width: 120,
            render: (_, row) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(row)}
                />
                <Popconfirm
                  title="Hapus stiker ini?"
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Stiker dihapus');
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Edit stiker' : 'Tambah stiker'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="id"
            label="Id (slug)"
            rules={[{ required: true, message: 'Id wajib diisi' }]}
          >
            <Input disabled={Boolean(editing)} placeholder="cheer" />
          </Form.Item>
          <Form.Item
            name="image_url"
            label="URL gambar"
            rules={[{ required: true, message: 'URL gambar wajib' }]}
          >
            <Input placeholder="https://cdn.jsdelivr.net/..." />
          </Form.Item>
          <Upload
            accept="image/png,image/jpeg,image/webp,image/gif"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              Unggah ke repo images
            </Button>
          </Upload>
          <Form.Item
            name="sort_order"
            label="Urutan"
            style={{ marginTop: 16 }}
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="play_once"
            label="Putar sekali (GIF)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="is_active" label="Aktif" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
