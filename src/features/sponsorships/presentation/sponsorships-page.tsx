import { useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import type { Sponsorship } from '../domain/sponsorship';
import {
  useCreateSponsorship,
  useDeleteSponsorship,
  useSponsorshipList,
  useUpdateSponsorship,
} from '../application/use-sponsorships';

export function SponsorshipsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const list = useSponsorshipList(canManage);
  const createMutation = useCreateSponsorship();
  const updateMutation = useUpdateSponsorship();
  const deleteMutation = useDeleteSponsorship();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsorship | null>(null);
  const [form] = Form.useForm();

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola sponsor.
      </Typography.Text>
    );
  }

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ since: new Date().toISOString().slice(0, 10), note: '' });
    setOpen(true);
  };

  const openEdit = (row: Sponsorship) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      description: row.description,
      logo_url: row.logoUrl,
      url: row.url,
      username: row.username,
      since: row.since,
      note: row.note,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setOpen(false);
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.warning(normalizeError(err).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Sponsor & Mitra"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Muat ulang
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Sponsor baru
            </Button>
          </Space>
        }
      />
      {list.isError ? (
        <Typography.Text type="danger">{normalizeError(list.error).message}</Typography.Text>
      ) : null}
      <Table<Sponsorship>
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={false}
        columns={[
          { title: 'Nama', dataIndex: 'name' },
          { title: 'Sejak', dataIndex: 'since', width: 120 },
          { title: 'Username', dataIndex: 'username', width: 140, render: (v) => v ?? '-' },
          {
            title: 'Catatan',
            dataIndex: 'note',
            ellipsis: true,
          },
          {
            title: 'Aksi',
            key: 'actions',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Popconfirm
                  title={`Hapus "${row.name}" dari daftar publik?`}
                  okText="Hapus"
                  cancelText="Batal"
                  onConfirm={() => deleteMutation.mutate(row.id)}
                >
                  <Button type="link" size="small" danger>
                    Hapus
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Edit sponsor' : 'Sponsor baru'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nama" rules={[{ required: true, message: 'Nama wajib' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="since" label="Sejak (YYYY-MM-DD)" rules={[{ required: true }]}>
            <Input placeholder="2026-01-01" />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="note" label="Catatan">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="logo_url" label="URL logo">
            <Input />
          </Form.Item>
          <Form.Item name="url" label="URL eksternal">
            <Input />
          </Form.Item>
          <Form.Item name="username" label="Username SambasKu">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
