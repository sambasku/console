import { useCallback, useMemo, useState } from 'react';
import { App as AntdApp, Button, Card, Form, Input, Space, Table, Tooltip } from 'antd';
import { SaveOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { useMobileReleases, useUpsertMobileRelease } from '../application/use-mobile-release';
import type { MobileRelease, MobileReleasePlatform } from '../domain/mobile-release';

export function MobileReleasePage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();

  const releasesQuery = useMobileReleases(canManage);
  const upsertRelease = useUpsertMobileRelease();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm<Record<string, string>>();

  const releases = useMemo(() => releasesQuery.data ?? [], [releasesQuery.data]);

  const handleSave = useCallback(async (row: MobileRelease) => {
    const values = form.getFieldsValue();
    const version = values[`${row.id}_version`];
    const storeUrl = values[`${row.id}_storeUrl`];
    const notes = values[`${row.id}_notes`];

    if (!version?.trim()) {
      message.error('Versi wajib diisi');
      return;
    }

    try {
      await upsertRelease.mutateAsync({
        platform: row.platform as MobileReleasePlatform,
        version: version.trim(),
        storeUrl: storeUrl?.trim() || null,
        notes: notes?.trim() || null,
      });
      message.success(`${row.platform === 'android' ? 'Android' : 'iOS'} diupdate`);
      setEditingKey(null);
    } catch (error) {
      message.error(normalizeError(error).message);
    }
  }, [form, message, upsertRelease]);

  const columns = useMemo(
    () => [
      {
        title: 'Platform',
        dataIndex: 'platform',
        key: 'platform',
        width: 100,
        render: (v: string) => {
          const label = v === 'android' ? 'Android' : 'iOS';
          const color = v === 'android' ? '#3DDC84' : '#000';
          return <span style={{ fontWeight: 600, color }}>{label}</span>;
        },
      },
      {
        title: 'Versi Terbaru',
        dataIndex: 'version',
        key: 'version',
        width: 120,
        render: (text: string, row: MobileRelease) => {
          if (editingKey === row.id) {
            return (
              <Form form={form} layout="inline">
                <Form.Item name={`${row.id}_version`} initialValue={text}>
                  <Input size="small" placeholder="x.y.z" />
                </Form.Item>
              </Form>
            );
          }
          return <code>{text}</code>;
        },
      },
      {
        title: 'Link Store',
        dataIndex: 'storeUrl',
        key: 'storeUrl',
        ellipsis: true,
        render: (text: string | null, row: MobileRelease) => {
          if (editingKey === row.id) {
            return (
              <Form form={form} layout="inline">
                <Form.Item name={`${row.id}_storeUrl`} initialValue={text ?? ''}>
                  <Input size="small" placeholder="https://..." />
                </Form.Item>
              </Form>
            );
          }
          if (!text) return <span style={{ color: '#999' }}>-</span>;
          return (
            <Tooltip title={text}>
              <a href={text} target="_blank" rel="noreferrer">
                {new URL(text).hostname}
              </a>
            </Tooltip>
          );
        },
      },
      {
        title: 'Catatan',
        dataIndex: 'notes',
        key: 'notes',
        ellipsis: true,
        render: (text: string | null, row: MobileRelease) => {
          if (editingKey === row.id) {
            return (
              <Form form={form} layout="inline">
                <Form.Item name={`${row.id}_notes`} initialValue={text ?? ''}>
                  <Input size="small" placeholder="opsional" />
                </Form.Item>
              </Form>
            );
          }
          return text ? <span>{text}</span> : <span style={{ color: '#999' }}>-</span>;
        },
      },
      {
        title: 'Aksi',
        key: 'action',
        width: 160,
        render: (_: unknown, row: MobileRelease) => {
          if (editingKey === row.id) {
            return (
              <Space size="small">
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  loading={upsertRelease.isPending}
                  onClick={() => handleSave(row)}
                >
                  Simpan
                </Button>
                <Button size="small" onClick={() => setEditingKey(null)}>
                  Batal
                </Button>
              </Space>
            );
          }
          return (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  [`${row.id}_version`]: row.version,
                  [`${row.id}_storeUrl`]: row.storeUrl ?? '',
                  [`${row.id}_notes`]: row.notes ?? '',
                });
                setEditingKey(row.id);
              }}
            >
              Edit
            </Button>
          );
        },
      },
    ],
    [editingKey, form, upsertRelease.isPending, handleSave],
  );

  return (
    <div>
      <PageHeader
        title="Mobile Release"
        subtitle="Kelola versi terbaru Android & iOS untuk banner update di app"
      />

      <Card loading={releasesQuery.isLoading}>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => releasesQuery.refetch()}
            loading={releasesQuery.isLoading}
          >
            Muat Ulang
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={releases}
          rowKey="id"
          pagination={false}
          loading={releasesQuery.isLoading}
          size="small"
        />
      </Card>
    </div>
  );
}
