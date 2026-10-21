import { useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import {
  WORD_GROUP_STATUS_LABELS,
  type WordGroupItem,
  type WordGroupStatus,
} from '../domain/word-group';
import {
  useAddWordGroupMember,
  useAllWordGroups,
  useCreateWordGroup,
  useDeleteWordGroup,
  usePickWords,
  useRemoveWordGroupMember,
  useUpdateWordGroup,
} from '../application/use-word-groups';

const STATUS_COLORS: Record<WordGroupStatus, string> = {
  pending_review: 'gold',
  published: 'green',
  rejected: 'red',
};

interface FormValues {
  name: string;
  description?: string | null;
  status?: WordGroupStatus;
}

export function WordGroupsPage() {
  const { user } = useAuth();
  // Vérifikator bisa tayang langsung; contributor/editor lain tetap bisa
  // mengajukan (backend yang tetapkan status akhir).
  const canManage = !!user;
  const { message } = AntdApp.useApp();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<WordGroupStatus | undefined>(undefined);
  const list = useAllWordGroups({ q: q.trim() || undefined, status: statusFilter });
  const createMutation = useCreateWordGroup();
  const updateMutation = useUpdateWordGroup();
  const deleteMutation = useDeleteWordGroup();
  const addMemberMutation = useAddWordGroupMember();
  const removeMemberMutation = useRemoveWordGroupMember();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WordGroupItem | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  const [membersOf, setMembersOf] = useState<WordGroupItem | null>(null);

  const items = useMemo(() => list.data ?? [], [list.data]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ name: '', description: null, status: 'published' });
    setDrawerOpen(true);
  };

  const openEdit = (row: WordGroupItem) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      description: row.description,
      status: row.status,
    });
    setDrawerOpen(true);
  };

  const handleFinish = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name: values.name.trim(),
          description: values.description ?? null,
          ...(values.status ? { status: values.status } : {}),
        });
        message.success('Kelompok makna diperbarui');
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          description: values.description ?? null,
          ...(values.status ? { status: values.status } : {}),
        });
        message.success('Kelompok makna dibuat');
      }
      setDrawerOpen(false);
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <Typography.Text type="secondary">
        Hanya user yang login yang bisa mengelola kelompok makna.
      </Typography.Text>
    );
  }

  return (
    <>
      <PageHeader
        title="Kelompok makna"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void list.refetch()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Kelompok baru
            </Button>
          </Space>
        }
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Cari nama kelompok"
          style={{ width: 240 }}
          onSearch={(v) => setQ(v)}
          onChange={(e) => {
            if (!e.target.value) setQ('');
          }}
        />
        <Select
          allowClear
          placeholder="Semua status"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={(Object.keys(WORD_GROUP_STATUS_LABELS) as WordGroupStatus[]).map((s) => ({
            value: s,
            label: WORD_GROUP_STATUS_LABELS[s],
          }))}
        />
      </Space>
      <Table
        rowKey="id"
        loading={list.isLoading}
        dataSource={items}
        pagination={false}
        locale={{ emptyText: 'Belum ada kelompok makna' }}
        columns={[
          { title: 'Nama', dataIndex: 'name' },
          {
            title: 'Deskripsi',
            dataIndex: 'description',
            ellipsis: true,
            render: (v: string | null) => v ?? '-',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 150,
            render: (s: WordGroupStatus) => (
              <Tag color={STATUS_COLORS[s]}>{WORD_GROUP_STATUS_LABELS[s]}</Tag>
            ),
          },
          {
            title: 'Anggota',
            width: 100,
            render: (_, row) => row.members.length,
          },
          {
            title: '',
            width: 200,
            render: (_, row) => (
              <Space>
                <Button
                  size="small"
                  icon={<TeamOutlined />}
                  onClick={() => setMembersOf(row)}
                >
                  Anggota
                </Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Hapus kelompok ini?"
                  description="Anggota keluar dari kelompok, kata tetap aman."
                  okText="Hapus"
                  cancelText="Batal"
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      message.success('Kelompok makna dihapus');
                    } catch (err) {
                      message.error(normalizeError(err).message);
                    }
                  }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    Hapus
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={editing ? 'Edit kelompok makna' : 'Kelompok makna baru'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Batal</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Simpan
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Nama" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input placeholder="mis. Mengapa" />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi (opsional)">
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            extra="Status published = tayang publik dan melebar ke pencarian."
          >
            <Select
              options={(Object.keys(WORD_GROUP_STATUS_LABELS) as WordGroupStatus[]).map((s) => ({
                value: s,
                label: WORD_GROUP_STATUS_LABELS[s],
              }))}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {membersOf && (
        <MembersDrawer
          group={membersOf}
          onClose={() => setMembersOf(null)}
          onAdd={async (wordId, notes) => {
            try {
              await addMemberMutation.mutateAsync({
                groupId: membersOf.id,
                word_id: wordId,
                notes,
              });
              message.success('Anggota ditambahkan');
            } catch (err) {
              message.error(normalizeError(err).message);
              throw err;
            }
          }}
          onRemove={async (wordId) => {
            try {
              await removeMemberMutation.mutateAsync({ groupId: membersOf.id, wordId });
              message.success('Anggota dikeluarkan');
            } catch (err) {
              message.error(normalizeError(err).message);
            }
          }}
        />
      )}
    </>
  );
}

interface MembersDrawerProps {
  group: WordGroupItem;
  onClose: () => void;
  onAdd: (wordId: string, notes?: string | null) => Promise<void>;
  onRemove: (wordId: string) => Promise<void>;
}

function MembersDrawer({ group, onClose, onAdd, onRemove }: MembersDrawerProps) {
  const [wordQuery, setWordQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const pick = usePickWords(wordQuery);

  const options = useMemo(
    () =>
      (pick.data ?? [])
        .filter((w) => !group.members.some((m) => m.wordId === w.id))
        .map((w) => ({ value: w.id, label: w.lemma })),
    [pick.data, group.members],
  );

  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <Drawer title={`Anggota - ${group.name}`} open onClose={onClose} width={480} destroyOnClose>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Typography.Text type="secondary">
          Cari kata yang mau dimasukkan. Kata anggota tidak hilang dari kamus, cuma diberi
          kelompok makna ini.
        </Typography.Text>
        <Select
          showSearch
          allowClear
          value={selected}
          placeholder="Cari kata..."
          filterOption={false}
          onSearch={setWordQuery}
          onChange={(v) => setSelected(v)}
          options={options}
          notFoundContent={wordQuery ? 'Kata tidak ditemukan' : 'Ketik minimal 1 huruf'}
          style={{ width: '100%' }}
        />
        <Input
          placeholder="Catatan nuansa/konteks (opsional)"
          value={notes}
          maxLength={300}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          type="primary"
          block
          loading={saving}
          disabled={!selected}
          onClick={async () => {
            if (!selected) return;
            setSaving(true);
            try {
              await onAdd(selected, notes.trim() || null);
              setSelected(undefined);
              setWordQuery('');
              setNotes('');
            } catch {
              // pesan error sudah tampil di parent
            } finally {
              setSaving(false);
            }
          }}
        >
          Tambahkan anggota
        </Button>
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={group.members}
          locale={{ emptyText: 'Belum ada anggota' }}
          columns={[
            { title: 'Kata', dataIndex: 'lemma' },
            {
              title: 'Catatan',
              dataIndex: 'notes',
              render: (v: string | null) => v ?? '-',
            },
            {
              title: '',
              width: 70,
              render: (_, row) => (
                <Popconfirm
                  title="Keluarkan kata ini dari kelompok?"
                  okText="Keluarkan"
                  cancelText="Batal"
                  onConfirm={() => onRemove(row.wordId)}
                >
                  <Button size="small" danger>
                    Keluarkan
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Space>
    </Drawer>
  );
}
