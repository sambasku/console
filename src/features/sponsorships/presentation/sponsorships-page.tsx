import { useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  App as AntdApp,
  Button,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { listAdminUsersRequest } from '@/features/users/infrastructure/user-admin-api';
import { listUsahaRequest } from '@/features/usaha/infrastructure/usaha-api';
import type { Sponsorship } from '../domain/sponsorship';
import { SPONSORSHIP_TIER_OPTIONS } from '../domain/sponsorship';
import { uploadSponsorshipLogo } from '../infrastructure/sponsorship-api';
import {
  useCreateSponsorship,
  useDeleteSponsorship,
  useSponsorshipList,
  useUpdateSponsorship,
} from '../application/use-sponsorships';


function SponsorLogoField({
  value,
  onChange,
}: {
  value?: string | null;
  onChange?: (url: string | null) => void;
}) {
  const { message } = AntdApp.useApp();
  const [uploading, setUploading] = useState(false);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    setUploading(true);
    uploadSponsorshipLogo(file as File)
      .then((url) => onChange?.(url))
      .catch((err) =>
        message.error(normalizeError(err).message || 'Gagal mengunggah logo'),
      )
      .finally(() => setUploading(false));
    return false;
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {value ? (
        <div
          style={{
            position: 'relative',
            width: 120,
            height: 72,
            background:
              'repeating-conic-gradient(#e7e5e4 0% 25%, #fafaf9 0% 50%) 50% / 12px 12px',
            borderRadius: 8,
            border: '1px solid #e7e5e4',
          }}
        >
          <Image
            src={value}
            width={120}
            height={72}
            style={{ objectFit: 'contain', borderRadius: 8 }}
            preview={false}
          />
          <Button
            size="small"
            danger
            shape="circle"
            icon={<DeleteOutlined />}
            style={{ position: 'absolute', top: -8, right: -8 }}
            onClick={() => onChange?.(null)}
          />
        </div>
      ) : null}
      <Upload
        accept="image/png,image/webp,image/jpeg"
        showUploadList={false}
        beforeUpload={beforeUpload}
      >
        <Button icon={<UploadOutlined />} loading={uploading}>
          {value ? 'Ganti logo' : 'Unggah logo'}
        </Button>
      </Upload>
    </Space>
  );
}

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
  const [userQ, setUserQ] = useState('');
  const [usahaQ, setUsahaQ] = useState('');
  const [form] = Form.useForm();

  const tierWatch = Form.useWatch('tier', form);
  const usahaWatch = Form.useWatch('usaha_id', form);
  const splashHint = Boolean(usahaWatch) && tierWatch && tierWatch !== 'perak';

  const usersQuery = useQuery({
    queryKey: ['sponsor-user-picker', userQ],
    queryFn: ({ signal }) => listAdminUsersRequest({ q: userQ || undefined, limit: 30 }, signal),
    enabled: canManage && open,
  });

  const usahaQuery = useQuery({
    queryKey: ['sponsor-usaha-picker', usahaQ],
    queryFn: ({ signal }) =>
      listUsahaRequest({ q: usahaQ || undefined, limit: 30, status: 'published' }, signal),
    enabled: canManage && open,
  });

  const userOptions = useMemo(() => {
    const items = usersQuery.data?.data ?? [];
    const opts = items.map((u) => ({
      value: u.id,
      label: `${u.username}${u.display_name ? ` (${u.display_name})` : ''}`,
    }));
    if (editing?.userId && !opts.some((o) => o.value === editing.userId)) {
      opts.unshift({
        value: editing.userId,
        label: editing.username ? `${editing.username} (tersimpan)` : editing.userId,
      });
    }
    return opts;
  }, [usersQuery.data, editing]);

  const usahaOptions = useMemo(() => {
    const items = usahaQuery.data?.items ?? [];
    const opts = items.map((u) => ({
      value: u.id,
      label: `${u.name} (${u.slug})`,
    }));
    if (editing?.usahaId && !opts.some((o) => o.value === editing.usahaId)) {
      opts.unshift({
        value: editing.usahaId,
        label: `${editing.usahaId} (tersimpan)`,
      });
    }
    return opts;
  }, [usahaQuery.data, editing]);

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola sponsor.
      </Typography.Text>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setUserQ('');
    setUsahaQ('');
    form.resetFields();
    form.setFieldsValue({
      since: new Date().toISOString().slice(0, 10),
      note: '',
      tier: 'perak',
      ends_on: null,
      user_id: null,
      usaha_id: null,
    });
    setOpen(true);
  };

  const openEdit = (row: Sponsorship) => {
    setEditing(row);
    setUserQ('');
    setUsahaQ('');
    form.setFieldsValue({
      name: row.name,
      description: row.description,
      logo_url: row.logoUrl,
      url: row.url,
      username: row.username,
      tier: row.tier,
      since: row.since,
      ends_on: row.endsOn,
      note: row.note,
      user_id: row.userId,
      usaha_id: row.usahaId,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const input = {
        ...values,
        ends_on: values.ends_on || null,
        user_id: values.user_id || null,
        usaha_id: values.usaha_id || null,
        logo_url: values.logo_url || null,
        url: values.url || null,
        username: values.username || null,
        description: values.description || null,
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
      } else {
        await createMutation.mutateAsync(input);
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
          {
            title: 'Tier',
            dataIndex: 'tier',
            width: 100,
            render: (v: string) => v.charAt(0).toUpperCase() + v.slice(1),
          },
          { title: 'Sejak', dataIndex: 'since', width: 110 },
          {
            title: 'Berakhir',
            dataIndex: 'endsOn',
            width: 110,
            render: (v) => v ?? '-',
          },
          {
            title: 'Usaha',
            dataIndex: 'usahaId',
            width: 120,
            ellipsis: true,
            render: (v) => v ?? '-',
          },
          { title: 'Username', dataIndex: 'username', width: 120, render: (v) => v ?? '-' },
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
        width={560}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Splash hanya jika usaha terhubung dan tier Emas / Intan / Mustika. Perak tetap dapat lencana di listing usaha."
        />
        {splashHint ? (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
            message="Kombinasi ini memenuhi syarat tampil di splash."
          />
        ) : null}
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nama" rules={[{ required: true, message: 'Nama wajib' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tier" label="Tingkat" rules={[{ required: true }]}>
            <Select options={SPONSORSHIP_TIER_OPTIONS} />
          </Form.Item>
          <Form.Item name="since" label="Sejak (YYYY-MM-DD)" rules={[{ required: true }]}>
            <Input placeholder="2026-01-01" />
          </Form.Item>
          <Form.Item name="ends_on" label="Berakhir (YYYY-MM-DD, opsional)">
            <Input placeholder="kosong = tanpa batas" allowClear />
          </Form.Item>
          <Form.Item
            name="usaha_id"
            label="Usaha (opsional)"
            extra="Wajib untuk splash Emas+ dan lencana di listing/detail usaha."
          >
            <Select
              allowClear
              showSearch
              placeholder="Cari usaha published"
              filterOption={false}
              onSearch={setUsahaQ}
              options={usahaOptions}
              loading={usahaQuery.isFetching}
              notFoundContent={usahaQuery.isFetching ? 'Memuat…' : 'Tidak ada'}
            />
          </Form.Item>
          <Form.Item
            name="user_id"
            label="Akun pengguna (opsional)"
            extra="Untuk taut profil / checkbox sponsor. Boleh kosong."
          >
            <Select
              allowClear
              showSearch
              placeholder="Cari username"
              filterOption={false}
              onSearch={setUserQ}
              options={userOptions}
              loading={usersQuery.isFetching}
              notFoundContent={usersQuery.isFetching ? 'Memuat…' : 'Tidak ada'}
            />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="note" label="Catatan">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="logo_url"
            label="Logo"
            extra="Di-resize di browser (maks 512px) lalu disimpan sebagai PNG supaya transparan tetap aman."
          >
            <SponsorLogoField />
          </Form.Item>
          <Form.Item name="url" label="URL eksternal">
            <Input />
          </Form.Item>
          <Form.Item name="username" label="Username SambasKu (teks)">
            <Input placeholder="Opsional bila user_id sudah dipilih" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
