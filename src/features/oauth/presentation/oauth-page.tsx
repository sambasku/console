import { useMemo, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { useLegalMutations, useLegalSettings } from '@/features/legal/application/use-legal';
import { useApiClientMutations, useApiClients } from '../application/use-api-clients';
import {
  ALL_SCOPES,
  type ApiClient,
  type ApiClientChannel,
  type ApiClientStatus,
} from '../domain/api-client';

const STATUS_COLOR: Record<ApiClientStatus, string> = {
  pending: 'default',
  approved: 'success',
  suspended: 'warning',
  revoked: 'error',
};

const STATUS_OPTIONS: { value: ApiClientStatus; label: string }[] = [
  { value: 'pending', label: 'pending' },
  { value: 'approved', label: 'approved' },
  { value: 'suspended', label: 'suspended' },
  { value: 'revoked', label: 'revoked' },
];

/**
 * Pengaturan runtime OAuth + CRUD api_clients (bukan login Google/Facebook).
 */
export function OauthPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const settingsQuery = useLegalSettings(canManage);
  const settingsMutations = useLegalMutations();
  const [statusFilter, setStatusFilter] = useState<ApiClientStatus | undefined>();
  const clientsQuery = useApiClients(canManage, statusFilter);
  const clientMutations = useApiClientMutations();

  const [settingsForm] = Form.useForm<{
    third_party_registration: string;
    retention_days: string;
  }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<ApiClient | null>(null);
  const [createForm] = Form.useForm<{
    client_id: string;
    name: string;
    description?: string;
    status: ApiClientStatus;
    allowed_scopes: string[];
    allowed_channels: ApiClientChannel[];
    homepage_url?: string;
    privacy_url?: string;
  }>();
  const [editForm] = Form.useForm<{
    name: string;
    description?: string;
    status: ApiClientStatus;
    allowed_scopes: string[];
    allowed_channels: ApiClientChannel[];
    homepage_url?: string;
    privacy_url?: string;
  }>();

  const settingsMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const s of settingsQuery.data ?? []) map[s.key] = s.value;
    return map;
  }, [settingsQuery.data]);

  const openEdit = (row: ApiClient) => {
    setEditClient(row);
    editForm.setFieldsValue({
      name: row.name,
      description: row.description ?? undefined,
      status: row.status,
      allowed_scopes: row.allowed_scopes,
      allowed_channels: row.allowed_channels,
      homepage_url: row.homepage_url ?? undefined,
      privacy_url: row.privacy_url ?? undefined,
    });
  };

  if (!canManage) {
    return (
      <Alert type="warning" showIcon message="Hanya admin/root yang dapat mengelola OAuth." />
    );
  }

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title="OAuth"
        subtitle="Pengaturan runtime dan daftar klien API (api_clients)"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                void settingsQuery.refetch();
                void clientsQuery.refetch();
              }}
            >
              Muat ulang
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                createForm.setFieldsValue({
                  client_id: '',
                  name: '',
                  status: 'pending',
                  allowed_scopes: ['vote.write'],
                  allowed_channels: ['web'],
                });
                setCreateOpen(true);
              }}
            >
              Klien baru
            </Button>
          </Space>
        }
      />

      <Card title="Pengaturan runtime" size="small" loading={settingsQuery.isLoading}>
        <Form
          form={settingsForm}
          layout="vertical"
          key={JSON.stringify(settingsMap)}
          initialValues={{
            third_party_registration: settingsMap['oauth.third_party_registration'] ?? 'closed',
            retention_days: settingsMap['oauth.request_log_retention_days'] ?? '90',
          }}
          onFinish={async (values) => {
            try {
              await settingsMutations.patchSettings.mutateAsync([
                { key: 'oauth.third_party_registration', value: values.third_party_registration },
                { key: 'oauth.request_log_retention_days', value: values.retention_days },
              ]);
              message.success('Pengaturan disimpan');
            } catch (err) {
              message.error(normalizeError(err).message);
            }
          }}
        >
          <Flex gap={16} wrap>
            <Form.Item name="third_party_registration" label="Registrasi third-party" style={{ minWidth: 200 }}>
              <Select
                options={[
                  { value: 'closed', label: 'closed' },
                  { value: 'open', label: 'open' },
                ]}
              />
            </Form.Item>
            <Form.Item name="retention_days" label="Retensi request log (hari)" style={{ minWidth: 160 }}>
              <Input />
            </Form.Item>
          </Flex>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            Gate JWT <Typography.Text code>azp</Typography.Text> dikontrol env{' '}
            <Typography.Text code>OAUTH_REQUIRE_AZP</Typography.Text> (bukan pengaturan ini).
          </Typography.Paragraph>
          <Popconfirm
            title="Simpan pengaturan OAuth?"
            description="Perubahan retensi / registrasi third-party berlaku segera."
            okText="Simpan"
            onConfirm={() => settingsForm.submit()}
          >
            <Button type="primary" loading={settingsMutations.patchSettings.isPending}>
              Simpan pengaturan
            </Button>
          </Popconfirm>
        </Form>
      </Card>

      <Card
        title="API clients"
        size="small"
        extra={
          <Select
            allowClear
            placeholder="Filter status"
            style={{ width: 160 }}
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
          />
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          First-party (<Typography.Text code>sambasku-*</Typography.Text>) tidak boleh di-revoke.
          Prefix <Typography.Text code>sambasku-</Typography.Text> dicadangkan.
        </Typography.Paragraph>
        <Table<ApiClient>
          rowKey="id"
          loading={clientsQuery.isLoading || clientsQuery.isFetching}
          dataSource={clientsQuery.data?.items ?? []}
          pagination={false}
          scroll={{ x: 960 }}
          columns={[
            {
              title: 'client_id',
              dataIndex: 'client_id',
              width: 180,
              render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
            },
            { title: 'Nama', dataIndex: 'name', ellipsis: true },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 120,
              render: (s: ApiClientStatus) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
            },
            {
              title: 'Tipe',
              dataIndex: 'is_first_party',
              width: 110,
              render: (v: boolean) => (v ? <Tag color="blue">first-party</Tag> : <Tag>third-party</Tag>),
            },
            {
              title: 'Scopes',
              dataIndex: 'allowed_scopes',
              ellipsis: true,
              render: (scopes: string[]) => scopes.join(' '),
            },
            {
              title: 'Dibuat',
              dataIndex: 'created_at',
              width: 170,
              render: (v: string) => formatDateTime(v),
            },
            {
              title: 'Aksi',
              width: 100,
              fixed: 'right',
              render: (_, row) => (
                <Button size="small" onClick={() => openEdit(row)}>
                  Edit
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Klien API baru"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        okText="Buat"
        confirmLoading={clientMutations.create.isPending}
        onOk={() => createForm.submit()}
        destroyOnClose
        width={640}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await clientMutations.create.mutateAsync({
                client_id: values.client_id,
                name: values.name,
                description: values.description || null,
                status: values.status,
                allowed_scopes: values.allowed_scopes,
                allowed_channels: values.allowed_channels,
                homepage_url: values.homepage_url || null,
                privacy_url: values.privacy_url || null,
              });
              message.success('Klien dibuat');
              setCreateOpen(false);
            } catch (err) {
              message.error(normalizeError(err).message);
            }
          }}
        >
          <Form.Item
            name="client_id"
            label="client_id"
            rules={[{ required: true, message: 'client_id wajib' }]}
            extra="Huruf kecil, angka, hyphen. Tanpa prefix sambasku-."
          >
            <Input placeholder="partner-kamus" />
          </Form.Item>
          <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS.filter((o) => o.value !== 'revoked')} />
          </Form.Item>
          <Form.Item name="allowed_scopes" label="Scopes" rules={[{ required: true }]}>
            <Select mode="multiple" options={ALL_SCOPES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="allowed_channels" label="Channels" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={[
                { value: 'web', label: 'web' },
                { value: 'mobile', label: 'mobile' },
              ]}
            />
          </Form.Item>
          <Form.Item name="homepage_url" label="Homepage URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="privacy_url" label="Privacy URL">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editClient ? `Edit ${editClient.client_id}` : 'Edit klien'}
        open={!!editClient}
        onCancel={() => setEditClient(null)}
        okText="Simpan"
        confirmLoading={clientMutations.update.isPending}
        onOk={() => editForm.submit()}
        destroyOnClose
        width={640}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!editClient) return;
            try {
              await clientMutations.update.mutateAsync({
                id: editClient.id,
                body: {
                  name: values.name,
                  description: values.description || null,
                  status: values.status,
                  allowed_scopes: values.allowed_scopes,
                  allowed_channels: values.allowed_channels,
                  homepage_url: values.homepage_url || null,
                  privacy_url: values.privacy_url || null,
                },
              });
              message.success('Klien diperbarui');
              setEditClient(null);
            } catch (err) {
              message.error(normalizeError(err).message);
            }
          }}
        >
          <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={STATUS_OPTIONS.filter(
                (o) => !(editClient?.is_first_party && o.value === 'revoked'),
              )}
            />
          </Form.Item>
          <Form.Item name="allowed_scopes" label="Scopes" rules={[{ required: true }]}>
            <Select mode="multiple" options={ALL_SCOPES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="allowed_channels" label="Channels" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={[
                { value: 'web', label: 'web' },
                { value: 'mobile', label: 'mobile' },
              ]}
            />
          </Form.Item>
          <Form.Item name="homepage_url" label="Homepage URL">
            <Input />
          </Form.Item>
          <Form.Item name="privacy_url" label="Privacy URL">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}
