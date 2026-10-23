import { useMemo, useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import {
  Alert,
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
  Tooltip,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
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

const columnHelper = createColumnHelper<typeof tableFeatureSet, WordGroupItem>();

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

  const [membersOfId, setMembersOfId] = useState<string | null>(null);

  const items = useMemo(() => list.data ?? [], [list.data]);
  // Turunkan dari data query, bukan snapshot objek: setelah invalidate, drawer
  // ikut render ulang dengan lemma terbaru.
  const membersOf = useMemo(
    () => items.find((g) => g.id === membersOfId) ?? null,
    [items, membersOfId],
  );

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

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          header: 'Nama',
          size: 220,
          meta: { fixed: 'left' },
          cell: (info) => <Typography.Text strong>{info.getValue()}</Typography.Text>,
        }),
        columnHelper.accessor('description', {
          header: 'Deskripsi',
          size: 280,
          cell: (info) => info.getValue() ?? '-',
        }),
        columnHelper.accessor('status', {
          header: 'Status',
          size: 140,
          cell: (info) => (
            <Tag color={STATUS_COLORS[info.getValue()]}>{WORD_GROUP_STATUS_LABELS[info.getValue()]}</Tag>
          ),
        }),
        columnHelper.accessor((row) => row.members.length, {
          id: 'members',
          header: 'Lemma',
          size: 90,
        }),
        columnHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 140,
          meta: { fixed: 'right' },
          cell: (info) => {
            const row = info.row.original;
            return (
              <Space size={0}>
                <Tooltip title="Kelola lemma">
                  <Button
                    type="link"
                    icon={<TeamOutlined />}
                    onClick={() => setMembersOfId(row.id)}
                  />
                </Tooltip>
                <Tooltip title="Edit">
                  <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                </Tooltip>
                <Popconfirm
                  title="Hapus kelompok ini?"
                  description="Lemma keluar dari kelompok, lema tetap aman."
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
                  <Button type="link" danger icon={<DeleteOutlined />} aria-label="Hapus" />
                </Popconfirm>
              </Space>
            );
          },
        }),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- openEdit hanya baca state setter + form statis
    [],
  );

  const table = useTable({
    features: tableFeatureSet,
    data: items,
    columns,
    getRowId: (row) => row.id,
    // Data sudah lengkap dari API (semua halaman dimuat) - tabel tidak
    // memotong baris. Sama seperti 13 halaman admin lain.
    manualPagination: true,
  });

  return (
    <>
      {!canManage ? (
        <Typography.Text type="secondary">
          Hanya user yang login yang bisa mengelola kelompok makna.
        </Typography.Text>
      ) : (
        <>
          <PageHeader
            title="Kelompok makna"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={() => void list.refetch()}>
                  Muat ulang
                </Button>
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

          {list.isError ? (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message="Gagal memuat kelompok makna"
              description={normalizeError(list.error).message}
            />
          ) : null}

          <DataTable
            table={table}
            rowKey={(record) => record.id}
            loading={list.isLoading || (list.isFetching && items.length === 0)}
          />
        </>
      )}

      <Drawer
        title={editing ? 'Edit kelompok makna' : 'Kelompok makna baru'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        destroyOnHidden
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
          onClose={() => setMembersOfId(null)}
          onAdd={async (wordId, notes) => {
            try {
              await addMemberMutation.mutateAsync({
                groupId: membersOf.id,
                word_id: wordId,
                notes,
              });
              message.success('Lemma ditambahkan');
            } catch (err) {
              message.error(normalizeError(err).message);
              throw err;
            }
          }}
          onRemove={async (wordId) => {
            try {
              await removeMemberMutation.mutateAsync({ groupId: membersOf.id, wordId });
              message.success('Lemma dikeluarkan');
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
    <Drawer title={`Lemma - ${group.name}`} open onClose={onClose} width={480} destroyOnHidden>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Typography.Text type="secondary">
          Cari lemma yang mau dimasukkan. Lemma tidak hilang dari kamus, cuma diberi
          kelompok makna ini.
        </Typography.Text>
        <Select
          showSearch
          allowClear
          value={selected}
          placeholder="Cari lemma..."
          filterOption={false}
          onSearch={setWordQuery}
          onChange={(v) => setSelected(v)}
          options={options}
          notFoundContent={wordQuery ? 'Lemma tidak ditemukan' : 'Ketik minimal 1 huruf'}
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
          Tambahkan lemma
        </Button>
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={group.members}
          locale={{ emptyText: 'Belum ada lemma' }}
          columns={[
            { title: 'Lemma', dataIndex: 'lemma' },
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
                  title="Keluarkan lemma ini dari kelompok?"
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
