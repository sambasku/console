import { useMemo, useState } from 'react';
import {
  App as AntdApp,
  Badge,
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { useWaLogs, useWaMutations, useWaTemplates, useWaUsage } from '../application/use-wa';
import type { WaTemplate } from '../domain/wa';

type Tab = 'test' | 'template' | 'quota';

/** Tag event_key jadi label manusiawi. */
const EVENT_LABELS: Record<string, string> = {
  verifier_application_approved: 'Verifikator disetujui',
  verifier_application_rejected: 'Verifikator ditolak',
  test: 'Test kirim',
};

function eventLabel(key: string): string {
  return EVENT_LABELS[key] ?? key;
}

function TestTab() {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<{ phone: string; template_id: string }>();
  const templates = useWaTemplates(true);
  const testSend = useWaMutations().testSend;

  const onFinish = async (values: { phone: string; template_id: string }) => {
    try {
      const result = await testSend.mutateAsync(values);
      if (result.sent) {
        const sisa = result.usage ? result.usage.limit_count - result.usage.used_count : null;
        message.success(
          sisa != null ? `Pesan uji terkirim. Sisa quota: ${sisa}` : 'Pesan uji terkirim',
        );
        form.resetFields();
      } else {
        message.error(result.reason ?? 'Pesan uji gagal dikirim');
      }
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Card title="Kirim pesan uji (raw isi template)" style={{ maxWidth: 560 }}>
      <Form form={form} layout="vertical" onFinish={(v) => void onFinish(v)}>
        <Form.Item
          name="phone"
          label="Nomor HP tujuan"
          rules={[
            { required: true, message: 'Nomor wajib diisi' },
            { pattern: /^[1-9]\d{7,14}$/, message: 'Format internasional tanpa +, contoh: 6281234567890' },
          ]}
        >
          <Input placeholder="6281234567890" inputMode="numeric" />
        </Form.Item>
        <Form.Item name="template_id" label="Template" rules={[{ required: true, message: 'Pilih template' }]}>
          <Select
            placeholder="Pilih template"
            style={{ width: '100%' }}
            onChange={(value) => form.setFieldValue('template_id', value)}
            value={form.getFieldValue('template_id') ?? ''}
          >
            <Select.Option value="" disabled>
              Pilih template
            </Select.Option>
            {(templates.data ?? []).map((t) => (
              <Select.Option key={t.id} value={t.id}>
                {eventLabel(t.event_key)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={testSend.isPending}>
          Kirim
        </Button>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          Isi dikirim mentah (placeholder {'{{nama}}'} tidak dirender), tetap masuk hitungan quota dan log.
        </Typography.Paragraph>
      </Form>
    </Card>
  );
}

function TemplateTab() {
  const { message } = AntdApp.useApp();
  const templates = useWaTemplates(true);
  const { updateTemplate } = useWaMutations();
  const [editing, setEditing] = useState<WaTemplate | null>(null);
  const [form] = Form.useForm<{
    body: string;
    meta_template_name: string;
    meta_template_language: string;
  }>();

  const openEdit = (t: WaTemplate) => {
    setEditing(t);
    form.setFieldsValue({
      body: t.body,
      meta_template_name: t.meta_template_name,
      meta_template_language: t.meta_template_language,
    });
  };

  const onSave = async () => {
    if (!editing) return;
    const values = await form.validateFields();
    try {
      await updateTemplate.mutateAsync({ id: editing.id, ...values });
      message.success('Template diperbarui');
      setEditing(null);
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const columns = [
    {
      title: 'Event',
      dataIndex: 'event_key',
      render: (v: string) => eventLabel(v),
    },
    { title: 'Template Meta', dataIndex: 'meta_template_name' },
    { title: 'Bahasa', dataIndex: 'meta_template_language', width: 80 },
    {
      title: 'Parameter',
      dataIndex: 'params',
      render: (params: { name: string; description: string }[]) =>
        params.map((p) => (
          <Tag key={p.name} title={p.description}>
            {`{{${p.name}}}`}
          </Tag>
        )),
    },
    {
      title: 'Aktif',
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean, row: WaTemplate) => (
        <Switch
          checked={v}
          onChange={(checked) => {
            updateTemplate.mutate({ id: row.id, enabled: checked });
          }}
        />
      ),
    },
    {
      title: 'Aksi',
      width: 90,
      render: (_: unknown, row: WaTemplate) => (
        <Button size="small" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Template pesan WA"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => templates.refetch()} loading={templates.isFetching}>
          Muat ulang
        </Button>
      }
    >
      <Table rowKey="id" loading={templates.isLoading} dataSource={templates.data ?? []} columns={columns} pagination={false} />
      <Modal
        title={editing ? `Edit template: ${eventLabel(editing.event_key)}` : ''}
        open={editing != null}
        onOk={() => void onSave()}
        onCancel={() => setEditing(null)}
        confirmLoading={updateTemplate.isPending}
        width={640}
        okText="Simpan"
      >
        {editing && (
          <>
            <Space wrap style={{ marginBottom: 12 }}>
              {editing.params.map((p) => (
                <Tag key={p.name} title={p.description}>
                  {`{{${p.name}}}`}: {p.description}
                </Tag>
              ))}
            </Space>
            <Form form={form} layout="vertical">
              <Form.Item name="body" label="Isi pesan" rules={[{ required: true }]}>
                <Input.TextArea rows={8} />
              </Form.Item>
              <Flex gap={12}>
                <Form.Item name="meta_template_name" label="Nama template Meta" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item name="meta_template_language" label="Bahasa" rules={[{ required: true }]} style={{ width: 140 }}>
                  <Input />
                </Form.Item>
              </Flex>
            </Form>
          </>
        )}
      </Modal>
    </Card>
  );
}

function QuotaTab() {
  const { message } = AntdApp.useApp();
  const usage = useWaUsage(true);
  const logs = useWaLogs(true);
  const { updateUsage } = useWaMutations();
  const [form] = Form.useForm<{ used_count?: number; limit_count?: number; warn_threshold_percent?: number }>();

  const u = usage.data;
  const progressStatus = u?.level === 'exhausted' ? 'exception' : u?.level === 'warn' ? 'active' : 'normal';

  const onCorrect = async () => {
    const values = await form.validateFields();
    try {
      await updateUsage.mutateAsync(values);
      message.success('Quota diperbarui');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const logColumns = [
    {
      title: 'Waktu',
      dataIndex: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    { title: 'Event', dataIndex: 'event_key', render: (v: string) => eventLabel(v) },
    { title: 'Tujuan', dataIndex: 'to_phone', width: 150 },
    { title: 'Channel', dataIndex: 'channel', width: 90 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 90,
      render: (v: string) =>
        v === 'sent' ? <Badge status="success" text="Terkirim" /> : <Badge status="error" text="Gagal" />,
    },
    {
      title: 'Error',
      dataIndex: 'error_message',
      ellipsis: true,
      render: (v: string | null) => v ?? '-',
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Card title="Quota provider (reset otomatis tiap tanggal 1)">
        {u ? (
          <>
            <Flex justify="space-between" style={{ marginBottom: 8 }}>
              <Typography.Text strong>
                {u.provider} - {u.used_count}/{u.limit_count} pesan
              </Typography.Text>
              <Tag color={u.level === 'exhausted' ? 'red' : u.level === 'warn' ? 'orange' : 'green'}>
                {u.level === 'exhausted' ? 'Quota habis' : u.level === 'warn' ? 'Mendekati limit' : 'Aman'}
              </Tag>
            </Flex>
            <Progress percent={u.percent} status={progressStatus} />
            <Typography.Text type="secondary">Periode berjalan sejak: {formatDateTime(u.period_start)}</Typography.Text>
          </>
        ) : (
          <Typography.Text type="secondary">Quota belum tersedia.</Typography.Text>
        )}
      </Card>

      <Card title="Koreksi manual (sinkron kirim dari dashboard Kapso)">
        <Form form={form} layout="inline" initialValues={{ limit_count: u?.limit_count, warn_threshold_percent: u?.warn_threshold_percent }}>
          <Form.Item name="used_count" label="Terpakai">
            <InputNumber min={0} placeholder={String(u?.used_count ?? '')} />
          </Form.Item>
          <Form.Item name="limit_count" label="Limit">
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="warn_threshold_percent" label="Ambang warna (%)">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Button type="primary" onClick={() => void onCorrect()} loading={updateUsage.isPending}>
            Simpan
          </Button>
        </Form>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          Kosongkan kolom yang tidak mau diubah. Kirim dari dashboard Kapso tidak otomatis tercatat di sini.
        </Typography.Text>
      </Card>

      <Card title="Log kirim terakhir">
        <Table rowKey="id" size="small" loading={logs.isLoading} dataSource={logs.data?.logs ?? []} columns={logColumns} pagination={false} />
        {logs.data?.next_cursor && (
          <Typography.Text type="secondary">Cursor berikut: {logs.data.next_cursor}</Typography.Text>
        )}
      </Card>
    </Flex>
  );
}

/** System > WhatsApp - test kirim, template, quota + log. */
export function SystemWhatsAppPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const [tab, setTab] = useState<Tab>('test');
  const tabs = useMemo(
    () =>
      [
        { label: 'Test', value: 'test' },
        { label: 'Template', value: 'template' },
        { label: 'Quota & Log', value: 'quota' },
      ] as const,
    [],
  );

  if (!canManage) {
    return (
      <>
        <PageHeader title="WhatsApp" />
        <Card>
          <Typography.Text type="warning">Hanya admin/root yang bisa mengakses halaman ini.</Typography.Text>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="WhatsApp"
        extra={
          <Segmented options={tabs as unknown as string[]} value={tab} onChange={(v) => setTab(v as Tab)} />
        }
      />
      {tab === 'test' && <TestTab />}
      {tab === 'template' && <TemplateTab />}
      {tab === 'quota' && <QuotaTab />}
    </>
  );
}
