import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Card,
  Flex,
  Form,
  Input,
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
import { useLegalMutations, useLegalSettings } from '@/features/legal/application/use-legal';
import {
  AUDIENCE_LABELS,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
  type NotificationCampaign,
} from '../domain/campaign';
import { useCampaignList } from '../application/use-campaigns';
import { CreateCampaignDrawer } from './create-campaign-drawer';

const APPROVE_COOLDOWN_KEY = 'notification.review_approve_push_cooldown_minutes';
const REJECT_COOLDOWN_KEY = 'notification.review_reject_push_cooldown_minutes';
const WORD_COMMENT_COOLDOWN_KEY = 'notification.word_comment_push_cooldown_minutes';

export function NotificationCampaignsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'root';
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const list = useCampaignList(undefined, canManage);
  const settingsQuery = useLegalSettings(canManage);
  const settingsMutations = useLegalMutations();
  const [cooldownForm] = Form.useForm<{
    approve_minutes: string;
    reject_minutes: string;
    word_comment_minutes: string;
  }>();

  const items = useMemo(
    () => list.data?.pages.flatMap((p) => p.data) ?? [],
    [list.data],
  );

  const settingsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of settingsQuery.data ?? []) {
      if (s.value != null) map[s.key] = s.value;
    }
    return map;
  }, [settingsQuery.data]);

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya admin/root yang bisa mengelola campaign.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Notification campaign"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => list.refetch()}>
              Muat ulang
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Campaign baru
            </Button>
          </Space>
        }
      />

      <Card
        title="Cooldown push (review & komentar)"
        size="small"
        style={{ marginBottom: 16 }}
        loading={settingsQuery.isLoading}
      >
        <Form
          form={cooldownForm}
          layout="vertical"
          key={JSON.stringify({
            a: settingsMap[APPROVE_COOLDOWN_KEY],
            r: settingsMap[REJECT_COOLDOWN_KEY],
            c: settingsMap[WORD_COMMENT_COOLDOWN_KEY],
          })}
          initialValues={{
            approve_minutes: settingsMap[APPROVE_COOLDOWN_KEY] ?? '360',
            reject_minutes: settingsMap[REJECT_COOLDOWN_KEY] ?? '360',
            word_comment_minutes: settingsMap[WORD_COMMENT_COOLDOWN_KEY] ?? '3',
          }}
          onFinish={async (values) => {
            try {
              await settingsMutations.patchSettings.mutateAsync([
                { key: APPROVE_COOLDOWN_KEY, value: values.approve_minutes },
                { key: REJECT_COOLDOWN_KEY, value: values.reject_minutes },
                { key: WORD_COMMENT_COOLDOWN_KEY, value: values.word_comment_minutes },
              ]);
              message.success('Cooldown push disimpan');
            } catch (err) {
              message.error(normalizeError(err).message);
            }
          }}
        >
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Push FCM pertama per channel langsung dikirim. Push berikutnya ke user yang sama
            ditahan selama jeda ini. Inbox in-app tetap langsung. Nilai 0 = tanpa cooldown.
          </Typography.Paragraph>
          <Flex gap={16} wrap>
            <Form.Item
              name="approve_minutes"
              label="Jeda setelah setujui (menit)"
              rules={[
                { required: true, message: 'Wajib diisi' },
                {
                  validator: async (_, value: string) => {
                    const n = Number(value);
                    if (!Number.isInteger(n) || n < 0 || n > 10080) {
                      throw new Error('Bilangan 0-10080');
                    }
                  },
                },
              ]}
              style={{ minWidth: 200 }}
            >
              <Input inputMode="numeric" />
            </Form.Item>
            <Form.Item
              name="reject_minutes"
              label="Jeda setelah tolak (menit)"
              rules={[
                { required: true, message: 'Wajib diisi' },
                {
                  validator: async (_, value: string) => {
                    const n = Number(value);
                    if (!Number.isInteger(n) || n < 0 || n > 10080) {
                      throw new Error('Bilangan 0-10080');
                    }
                  },
                },
              ]}
              style={{ minWidth: 200 }}
            >
              <Input inputMode="numeric" />
            </Form.Item>
            <Form.Item
              name="word_comment_minutes"
              label="Jeda komentar diskusi (menit)"
              rules={[
                { required: true, message: 'Wajib diisi' },
                {
                  validator: async (_, value: string) => {
                    const n = Number(value);
                    if (!Number.isInteger(n) || n < 0 || n > 10080) {
                      throw new Error('Bilangan 0-10080');
                    }
                  },
                },
              ]}
              style={{ minWidth: 200 }}
            >
              <Input inputMode="numeric" />
            </Form.Item>
          </Flex>
          <Popconfirm
            title="Simpan cooldown push?"
            description="Perubahan berlaku segera untuk push berikutnya."
            okText="Simpan"
            onConfirm={() => cooldownForm.submit()}
          >
            <Button type="primary" loading={settingsMutations.patchSettings.isPending}>
              Simpan cooldown
            </Button>
          </Popconfirm>
        </Form>
      </Card>

      {list.isError ? (
        <Typography.Text type="danger">{normalizeError(list.error).message}</Typography.Text>
      ) : null}
      <Table
        rowKey="id"
        loading={list.isLoading}
        dataSource={items}
        pagination={false}
        onRow={(row) => ({
          onClick: () => navigate({ to: '/notification-campaigns/$id', params: { id: row.id } }),
          style: { cursor: 'pointer' },
        })}
        columns={[
          { title: 'Judul', dataIndex: 'title', key: 'title' },
          {
            title: 'Audience',
            key: 'audience',
            render: (_: unknown, row: NotificationCampaign) => AUDIENCE_LABELS[row.audienceType],
          },
          {
            title: 'Status',
            key: 'status',
            render: (_: unknown, row: NotificationCampaign) => (
              <Tag color={CAMPAIGN_STATUS_COLORS[row.status]}>
                {CAMPAIGN_STATUS_LABELS[row.status]}
              </Tag>
            ),
          },
          {
            title: 'Target',
            dataIndex: 'targetedUsers',
            key: 'targeted',
            width: 90,
          },
          {
            title: 'Push OK / gagal',
            key: 'push',
            render: (_: unknown, row: NotificationCampaign) =>
              `${row.pushSuccess} / ${row.pushFailed}`,
          },
          {
            title: 'Dibuat',
            key: 'created',
            render: (_: unknown, row: NotificationCampaign) => formatDateTime(row.createdAt),
          },
        ]}
      />
      {list.hasNextPage ? (
        <Button
          style={{ marginTop: 12 }}
          loading={list.isFetchingNextPage}
          onClick={() => list.fetchNextPage()}
        >
          Muat lebih
        </Button>
      ) : null}
      <CreateCampaignDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          message.success('Draft campaign dibuat');
          navigate({ to: '/notification-campaigns/$id', params: { id } });
        }}
      />
    </>
  );
}
