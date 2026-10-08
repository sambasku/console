import { useMemo, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import type { Announcement } from '../domain/announcement';
import { useAnnouncementList, useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement } from '../application/use-announcements';
import { AnnouncementDrawer } from './announcement-drawer';

function formatEpoch(seconds: number): string {
  return formatDateTime(new Date(seconds * 1000).toISOString());
}

/** Kelola pengumuman yang tayang di feed publik aplikasi (#102). */
export function AnnouncementsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const list = useAnnouncementList(canManage);
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const items = useMemo(
    () => list.data?.pages.flatMap((p) => p.items) ?? [],
    [list.data],
  );
  const hasNext = list.data?.pages.at(-1)?.nextCursor != null;

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola pengumuman.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Pengumuman"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Muat ulang
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              Pengumuman baru
            </Button>
          </Space>
        }
      />

      {list.isError ? (
        <Typography.Text type="danger">{normalizeError(list.error).message}</Typography.Text>
      ) : null}
      <Table<Announcement>
        rowKey="id"
        loading={list.isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          {
            title: 'Judul',
            dataIndex: 'title',
            key: 'title',
            render: (_: unknown, row) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{row.title}</Typography.Text>
                <Typography.Text type="secondary" ellipsis style={{ maxWidth: 420 }}>
                  {row.body}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: 'Action',
            key: 'action',
            width: 220,
            render: (_: unknown, row) =>
              row.actionUrl ? (
                <Space direction="vertical" size={0}>
                  <Typography.Link href={row.actionUrl} target="_blank" rel="noreferrer">
                    {row.actionLabel ?? 'Buka'}
                  </Typography.Link>
                </Space>
              ) : (
                <Typography.Text type="secondary">-</Typography.Text>
              ),
          },
          {
            title: 'Berlaku s/d',
            key: 'expires',
            width: 170,
            render: (_: unknown, row) =>
              row.expiresAt ? (
                <Tag color={row.expiresAt * 1000 <= Date.now() ? 'red' : 'green'}>
                  {formatEpoch(row.expiresAt)}
                </Tag>
              ) : (
                <Typography.Text type="secondary">tanpa batas</Typography.Text>
              ),
          },
          {
            title: 'Dibuat',
            key: 'created',
            width: 170,
            render: (_: unknown, row) => formatEpoch(row.createdAt),
          },
          {
            title: '',
            key: 'ops',
            width: 140,
            render: (_: unknown, row) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(row);
                    setDrawerOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Hapus pengumuman?"
                  description="Item hilang dari feed publik aplikasi."
                  okText="Hapus"
                  okButtonProps={{ danger: true }}
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Pengumuman dihapus');
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  <Button size="small" danger loading={deleteMutation.isPending}>
                    Hapus
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      {hasNext ? (
        <Button style={{ marginTop: 12 }} loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
          Muat lebih
        </Button>
      ) : null}

      <AnnouncementDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setDrawerOpen(false)}
        submit={(values) =>
          editing ? updateMutation.mutateAsync({ id: editing.id, ...values }) : createMutation.mutateAsync(values)
        }
      />
    </>
  );
}
