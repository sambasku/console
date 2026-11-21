import { useMemo, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { useAuth } from '@/shared/auth/use-auth';
import { normalizeError } from '@/shared/api/error';
import { listAdminUsersRequest } from '@/features/users/infrastructure/user-admin-api';
import {
  useLeaderboardExclusionMutations,
  useLeaderboardExclusions,
} from '../application/use-leaderboard-exclusions';

function canManageLeaderboard(roles: string[] | undefined): boolean {
  return (roles ?? []).some((r) => r === 'root' || r === 'admin');
}

export function LeaderboardExclusionsPage() {
  const { message, modal } = AntdApp.useApp();
  const { user } = useAuth();
  const canManage = canManageLeaderboard(user?.roles);
  const list = useLeaderboardExclusions(canManage);
  const { add, remove } = useLeaderboardExclusionMutations();
  const [addOpen, setAddOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [form] = Form.useForm<{ user_id: string; note?: string }>();

  const excludedIds = useMemo(
  () => new Set((list.data ?? []).map((r) => r.user_id)),
    [list.data],
  );

  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.trim().length < 2) {
      setUserOptions([]);
      return;
    }
    try {
      const page = await listAdminUsersRequest({ q: q.trim(), limit: 20 });
      setUserOptions(
        page.data
          .filter((u) => !excludedIds.has(u.id))
          .map((u) => ({
            value: u.id,
            label: `${u.username}${u.display_name ? ` (${u.display_name})` : ''}`,
          })),
      );
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const onAdd = async () => {
    try {
      const values = await form.validateFields();
      const result = await add.mutateAsync({
        user_id: values.user_id,
        note: values.note?.trim() || null,
      });
      setAddOpen(false);
      form.resetFields();
      if (result.refreshed) {
        message.success('User dikecualikan. current.json di-refresh.');
      } else {
        message.warning(
          'User dikecualikan, tapi CDN belum ke-refresh. Coba refresh manual.',
        );
      }
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  const onRemove = (userId: string, username: string, isDefault: boolean) => {
    if (isDefault) {
      message.warning('Akun sistem bawaan tidak bisa dikeluarkan dari daftar.');
      return;
    }
    modal.confirm({
      title: `Keluarkan @${username} dari exclude?`,
      content: 'User ini bisa muncul lagi di papan peringkat setelah CDN refresh.',
      okText: 'Keluarkan',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          const result = await remove.mutateAsync(userId);
          if (result.refreshed) {
            message.success('Exclude dihapus. current.json di-refresh.');
          } else {
            message.warning('Exclude dihapus, tapi CDN belum ke-refresh.');
          }
        } catch (err) {
          message.error(normalizeError(err).message);
        }
      },
    });
  };

  if (!canManage) {
    return (
      <PageHeader title="Papan peringkat" subtitle="Kelola user yang dikecualikan dari peringkat mingguan." />
    );
  }

  return (
    <>
      <PageHeader
        title="Papan peringkat"
        subtitle="User di daftar ini tidak masuk agregat peringkat mingguan. Perubahan memicu refresh current.json bila storage leaderboard aktif."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            Tambah exclude
          </Button>
        }
      />
      <Table
        rowKey="user_id"
        loading={list.isLoading}
        dataSource={list.data ?? []}
        pagination={false}
        columns={[
          {
            title: 'Username',
            dataIndex: 'username',
            render: (username: string, row) => (
              <Space>
                <span>@{username}</span>
                {row.is_default_system ? <Tag color="blue">Sistem bawaan</Tag> : null}
              </Space>
            ),
          },
          {
            title: 'Nama tampilan',
            dataIndex: 'display_name',
            render: (v: string | null) => v ?? '-',
          },
          {
            title: 'Catatan',
            dataIndex: 'note',
            render: (v: string | null) => v ?? '-',
          },
          {
            title: '',
            key: 'actions',
            width: 120,
            render: (_, row) => (
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={row.is_default_system}
                loading={remove.isPending}
                onClick={() => onRemove(row.user_id, row.username, row.is_default_system)}
              >
                Hapus
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title="Tambah ke daftar exclude"
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          form.resetFields();
        }}
        onOk={onAdd}
        confirmLoading={add.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="user_id"
            label="User"
            rules={[{ required: true, message: 'Pilih user dulu' }]}
          >
            <Select
              showSearch
              filterOption={false}
              onSearch={searchUsers}
              options={userOptions}
              placeholder="Cari username (min. 2 karakter)"
              notFoundContent={userSearch.trim().length < 2 ? 'Ketik min. 2 karakter' : 'Tidak ada hasil'}
            />
          </Form.Item>
          <Form.Item name="note" label="Catatan (opsional)">
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}