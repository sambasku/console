import { useMemo, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { useLegalSettings, useLegalMutations } from '@/features/legal/application/use-legal';

function SystemConfigPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();

  const settingsQuery = useLegalSettings(canManage);
  const { patchSettings } = useLegalMutations();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm<Record<string, string>>();

  const allSettings = settingsQuery.data ?? [];

  const columns = useMemo(() => [
    {
      title: 'Key',
      dataIndex: 'key',
      width: 280,
      render: (key: string, row: { description: string | null; type: string }) => (
        <Flex vertical gap={2}>
          <Typography.Text code>{key}</Typography.Text>
          {row.description && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{row.description}</Typography.Text>}
        </Flex>
      ),
    },
    {
      title: 'Tipe',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Nilai',
      dataIndex: 'value',
      render: (value: string | null, row: { key: string; value: string | null; type: string }) => {
        const display = value ?? (row.type === 'boolean' ? 'false' : '-');

        if (editingKey === row.key) {
          return (
            <Form form={form} layout="inline" onFinish={() => handleSave(row.key, row.type)}>
              <Form.Item name={row.key} rules={[{ required: row.type !== 'string' }]}>
                {renderEditor(row.key, row.type, display)}
              </Form.Item>
              <Space>
                <Button type="primary" size="small" icon={<SaveOutlined />} htmlType="submit" loading={patchSettings.isPending}>
                  Simpan
                </Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => setEditingKey(null)}>
                  Batal
                </Button>
              </Space>
            </Form>
          );
        }

        if (row.type === 'boolean') {
          return value === 'true' ? <Tag color="green">Aktif</Tag> : <Tag color="default">Nonaktif</Tag>;
        }
        if (row.type === 'url' && value) {
          return <Typography.Link href={value} target="_blank" rel="noreferrer">{value}</Typography.Link>;
        }
        return <Typography.Text code style={{ maxWidth: 400 }}>{display}</Typography.Text>;
      },
    },
    {
      title: 'Aksi',
      width: 100,
      render: (_: unknown, row: { key: string; value: string | null; type: string }) =>
        editingKey !== row.key ? (
          <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(row.key, row.value, row.type)}>
            Edit
          </Button>
        ) : null,
    },
  ], [editingKey, form, patchSettings.isPending]);

  const startEdit = (key: string, value: string | null, type: string) => {
    let initial = value ?? '';
    if (type === 'boolean') initial = value ?? 'false';
    form.setFieldsValue({ [key]: initial });
    setEditingKey(key);
  };

  const handleSave = async (key: string, type: string) => {
    try {
      const values = await form.validateFields();
      await patchSettings.mutateAsync([{ key, value: String(values[key]), type }]);
      message.success('Setting diperbarui');
      setEditingKey(null);
      void settingsQuery.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const renderEditor = (key: string, type: string, currentValue: string) => {
    switch (type) {
      case 'boolean':
        return (
          <Select
            value={currentValue}
            onChange={(v) => form.setFieldValue(key, v)}
            style={{ width: 160 }}
          >
            <Select.Option value="true">Aktif (true)</Select.Option>
            <Select.Option value="false">Nonaktif (false)</Select.Option>
          </Select>
        );
      case 'number':
        return (
          <InputNumber
            value={currentValue ? Number(currentValue) : undefined}
            onChange={(v) => form.setFieldValue(key, v?.toString() ?? '')}
            style={{ width: 160 }}
            placeholder="Masukkan angka"
          />
        );
      case 'url':
        return (
          <Input
            placeholder="https://..."
            value={currentValue}
            onChange={(e) => form.setFieldValue(key, e.target.value)}
            style={{ width: 400 }}
          />
        );
      default:
        return (
          <Input
            placeholder="Masukkan nilai"
            value={currentValue}
            onChange={(e) => form.setFieldValue(key, e.target.value)}
            style={{ width: 400 }}
          />
        );
    }
  };

  if (!canManage) {
    return (
      <>
        <PageHeader title="Konfigurasi Sistem" />
        <Card>
          <Typography.Text type="warning">Hanya admin/root yang bisa mengakses halaman ini.</Typography.Text>
        </Card>
      </>
    );
  }

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title="Konfigurasi Sistem"
        subtitle="Semua pengaturan key-value aplikasi (app_settings). Edit inline per baris. Type & description dari DB."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void settingsQuery.refetch()} loading={settingsQuery.isFetching}>
            Muat ulang
          </Button>
        }
      />

      <Card title="Pengaturan Aplikasi" size="small">
        {settingsQuery.isLoading ? (
          <Typography.Text type="secondary">Memuat...</Typography.Text>
        ) : allSettings.length === 0 ? (
          <Typography.Text type="secondary">Belum ada setting.</Typography.Text>
        ) : (
          <Table
            rowKey="key"
            loading={settingsQuery.isLoading}
            dataSource={allSettings}
            columns={columns}
            pagination={false}
            scroll={{ x: 1100 }}
            locale={{ emptyText: 'Belum ada setting' }}
          />
        )}
      </Card>
    </Flex>
  );
}

export { SystemConfigPage };