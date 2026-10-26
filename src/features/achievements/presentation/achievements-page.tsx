import { useMemo, useState } from 'react';
import {
  ApiOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  App as AntdApp,
  Badge,
  Button,
  Drawer,
  Image,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  REWARD_TYPE_LABELS,
  type Achievement,
  type RewardType,
} from '../domain/achievement';
import {
  useAchievementList,
  useCreateAchievement,
  useDeleteAchievement,
  useGrantAchievement,
  usePreviewAchievement,
  useRecipients,
  useRevokeAward,
  useScanAchievement,
  useUpdateAchievement,
} from '../application/use-achievements';
import { AchievementDrawer } from './achievement-drawer';

type FilterTab = 'all' | RewardType;

const TABS: Array<{ value: FilterTab; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'badge', label: 'Badge' },
  { value: 'profile_border', label: 'Border' },
  { value: 'sticker', label: 'Stiker' },
];

/** Halaman Pencapaian: katalog border/badge/stiker + evaluasi. */
export function AchievementsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const { message } = AntdApp.useApp();
  const [tab, setTab] = useState<FilterTab>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [grantTarget, setGrantTarget] = useState<Achievement | null>(null);
  const [usernames, setUsernames] = useState('');
  const [previewTarget, setPreviewTarget] = useState<Achievement | null>(null);
  const [recipientsTarget, setRecipientsTarget] = useState<Achievement | null>(null);

  const list = useAchievementList(tab === 'all' ? undefined : tab);
  const createMutation = useCreateAchievement();
  const updateMutation = useUpdateAchievement();
  const deleteMutation = useDeleteAchievement();
  const scanMutation = useScanAchievement();
  const grantMutation = useGrantAchievement();
  const revokeMutation = useRevokeAward();
  const preview = usePreviewAchievement(!!previewTarget, previewTarget?.id ?? null);
  const recipients = useRecipients(!!recipientsTarget, recipientsTarget?.id ?? null);

  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola pencapaian.
      </Typography.Text>
    );
  }

  const handleGrant = async () => {
    if (!grantTarget) return;
    const names = usernames
      .split(/[\s,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) {
      message.error('Isi minimal satu username');
      return;
    }
    try {
      const result = await grantMutation.mutateAsync({ id: grantTarget.id, usernames: names });
      const parts = [`${result.awarded} diberikan`];
      if (result.skipped > 0) parts.push(`${result.skipped} sudah punya`);
      if (result.missing.length > 0) parts.push(`${result.missing.length} tidak ditemukan`);
      message.success(parts.join(', '));
      setGrantTarget(null);
      setUsernames('');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Pencapaian"
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
              Pencapaian baru
            </Button>
          </Space>
        }
      />

      <Segmented
        options={TABS}
        value={tab}
        onChange={(v) => setTab(v as FilterTab)}
        style={{ marginBottom: 12 }}
      />

      {list.isError ? (
        <Typography.Text type="danger">{normalizeError(list.error).message}</Typography.Text>
      ) : null}

      <Table<Achievement>
        rowKey="id"
        loading={list.isLoading}
        dataSource={items}
        pagination={false}
        columns={[
          {
            title: 'Aset',
            key: 'asset',
            width: 80,
            render: (_: unknown, row) =>
              row.badgeUrl ? (
                <Image src={row.badgeUrl} alt={row.title} width={44} height={44} style={{ objectFit: 'contain' }} />
              ) : (
                <Typography.Text type="secondary">-</Typography.Text>
              ),
          },
          {
            title: 'Pencapaian',
            key: 'title',
            render: (_: unknown, row) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{row.title}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {row.code}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: 'Jenis',
            key: 'reward',
            width: 110,
            render: (_: unknown, row) => <Tag>{REWARD_TYPE_LABELS[row.rewardType]}</Tag>,
          },
          {
            title: 'Kategori',
            key: 'category',
            width: 120,
            render: (_: unknown, row) => (
              <Tag color="blue">{ACHIEVEMENT_CATEGORY_LABELS[row.category]}</Tag>
            ),
          },
          {
            title: 'Kriteria',
            key: 'criteria',
            width: 200,
            render: (_: unknown, row) => (
              <Space direction="vertical" size={0}>
                <Typography.Text style={{ fontSize: 12 }}>{row.criteria.source}</Typography.Text>
                {row.criteria.window ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.criteria.window.from.slice(0, 10)} s/d {row.criteria.window.to.slice(0, 10)}
                  </Typography.Text>
                ) : null}
                {row.criteria.threshold != null ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    min {row.criteria.threshold}
                  </Typography.Text>
                ) : null}
              </Space>
            ),
          },
          {
            title: 'Penerima',
            key: 'recipients',
            width: 100,
            render: (_: unknown, row) => <Badge count={row.recipientCount ?? 0} showZero />,
          },
          {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_: unknown, row) =>
              row.isActive ? (
                <Tag color="green">Aktif</Tag>
              ) : (
                <Tag color="default">Nonaktif</Tag>
              ),
          },
          {
            title: 'Dibuat',
            key: 'created',
            width: 170,
            render: (_: unknown, row) => formatDateTime(new Date(row.createdAt * 1000).toISOString()),
          },
          {
            title: '',
            key: 'ops',
            width: 320,
            render: (_: unknown, row) => (
              <Space wrap>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewTarget(row)}
                >
                  Preview
                </Button>
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  loading={scanMutation.isPending}
                  onClick={async () => {
                    try {
                      const result = await scanMutation.mutateAsync(row.id);
                      message.success(
                        result.awarded > 0
                          ? `${result.awarded} user dapat pencapaian ini`
                          : 'Tidak ada user baru yang memenuhi',
                      );
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  Scan
                </Button>
        <Button
          size="small"
          icon={<ApiOutlined />}
          onClick={() => {
            setGrantTarget(row);
            setUsernames('');
          }}
        >
          Grant
        </Button>
        <Button
          size="small"
          icon={<TeamOutlined />}
          onClick={() => setRecipientsTarget(row)}
        >
          Penerima
        </Button>
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
                  title="Hapus pencapaian?"
                  description="Achievement hilang dari katalog. Yang sudah didapat user tetap tampil."
                  okText="Hapus"
                  okButtonProps={{ danger: true }}
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Pencapaian dihapus');
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

      <AchievementDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setDrawerOpen(false)}
        submit={(values) =>
          editing
            ? updateMutation.mutateAsync({ id: editing.id, ...values })
            : createMutation.mutateAsync(values)
        }
      />

      <Modal
        title="Grant manual"
        open={!!grantTarget}
        onCancel={() => setGrantTarget(null)}
        onOk={handleGrant}
        okText="Berikan"
        confirmLoading={grantMutation.isPending}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          Satu username per baris (atau pisahkan dengan spasi/koma). User yang sudah punya pencapaian ini
          dilewati.
        </Typography.Paragraph>
        <Input.TextArea
          rows={6}
          value={usernames}
          onChange={(e) => setUsernames(e.target.value)}
          placeholder={'contoh: nama-user-1\nnama-user-2\nnama-user-3'}
        />
      </Modal>

      <Modal
        title={previewTarget ? `Preview - ${previewTarget.title}` : 'Preview'}
        open={!!previewTarget}
        onCancel={() => setPreviewTarget(null)}
        footer={null}
        destroyOnHidden
      >
        {preview.isLoading ? (
          <Typography.Text type="secondary">Memuat...</Typography.Text>
        ) : preview.isError ? (
          <Typography.Text type="danger">{normalizeError(preview.error).message}</Typography.Text>
        ) : (
          <>
            <Typography.Paragraph>
              Ada <Typography.Text strong>{preview.data?.total ?? 0}</Typography.Text> user yang memenuhi
              kriteria tapi belum dapat pencapaian ini.
            </Typography.Paragraph>
            <Table
              rowKey="username"
              size="small"
              pagination={false}
              dataSource={preview.data?.sample ?? []}
              columns={[
                { title: 'Username', dataIndex: 'username', key: 'username' },
                { title: 'Nama', dataIndex: 'display_name', key: 'display_name' },
              ]}
            />
          </>
        )}
      </Modal>

      <Drawer
        title={recipientsTarget ? `Penerima - ${recipientsTarget.title}` : 'Penerima'}
        placement="right"
        width={640}
        open={!!recipientsTarget}
        onClose={() => setRecipientsTarget(null)}
        destroyOnHidden
      >
        {recipients.isLoading ? (
          <Typography.Text type="secondary">Memuat...</Typography.Text>
        ) : recipients.isError ? (
          <Typography.Text type="danger">{normalizeError(recipients.error).message}</Typography.Text>
        ) : recipients.data?.length ? (
          <Table
            rowKey="awardId"
            size="small"
            pagination={false}
            dataSource={recipients.data}
            columns={[
              { title: 'Username', dataIndex: 'username', key: 'username' },
              { title: 'Nama', dataIndex: 'displayName', key: 'displayName' },
              {
                title: 'Diberikan',
                key: 'awardedAt',
                render: (_: unknown, row) =>
                  formatDateTime(new Date(row.awardedAt * 1000).toISOString()),
              },
              {
                title: 'Dari',
                key: 'grantedVia',
                width: 90,
                render: (_: unknown, row) => <Tag>{row.grantedVia}</Tag>,
              },
              {
                title: '',
                key: 'ops',
                width: 90,
                render: (_: unknown, row) => (
                  <Popconfirm
                    title="Cabut pencapaian ini?"
                    description={`${row.username} tidak akan punya pencapaian ini lagi.`}
                    okText="Cabut"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await revokeMutation.mutateAsync({
                          achievementId: recipientsTarget!.id,
                          awardId: row.awardId,
                        });
                        message.success('Pencapaian dicabut');
                      } catch (err) {
                        message.error(normalizeError(err).message);
                      }
                    }}
                  >
                    <Button size="small" danger loading={revokeMutation.isPending}>
                      Cabut
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />
        ) : (
          <Typography.Text type="secondary">Belum ada penerima.</Typography.Text>
        )}
      </Drawer>
    </>
  );
}
