import { useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Flex,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import {
  useAdminArticleList,
  useCategoryOptions,
  useDeleteAdminArticle,
} from '../application/use-encyclopedia-articles';
import {
  ARTICLE_STATUS_COLOR,
  ARTICLE_STATUS_LABEL,
  type AdminArticleListItem,
  type ArticleStatus,
} from '../domain/encyclopedia';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { ArticleDrawer } from './article-drawer';
import { ArticleRevisionsDrawer } from './article-revisions-drawer';

export function EncyclopediaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = AntdApp.useApp();
  const canManage = user?.role === 'admin' || user?.role === 'root' || user?.role === 'editor';

  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<AdminArticleListItem | null>(null);
  const [revisionsArticleId, setRevisionsArticleId] = useState<string | null>(null);

  const q = useDebouncedValue(searchInput, 300);

  const listQuery = useAdminArticleList({
    q: q || undefined,
    category_id: categoryFilter,
    status: statusFilter,
    limit: 50,
  });

  const categoriesQuery = useCategoryOptions();
  const deleteMutation = useDeleteAdminArticle();

  const items = listQuery.data?.items ?? [];
  const categoryOptions = useMemo(
    () => (categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesQuery.data],
  );

  const onDelete = async (item: AdminArticleListItem) => {
    try {
      await deleteMutation.mutateAsync(item.id);
      message.success(`Artikel "${item.title}" diarsipkan`);
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Ensiklopedia"
        subtitle="Kelola artikel pengetahuan, sejarah, budaya, dan tokoh Sambas."
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void listQuery.refetch()}
              loading={listQuery.isFetching}
            >
              Muat ulang
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => navigate({ to: '/encyclopedia/contributions' as never })}
            >
              Antrean Usulan
            </Button>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              disabled={!canManage}
              onClick={() => {
                setEditingArticle(null);
                setDrawerOpen(true);
              }}
            >
              Artikel baru
            </Button>
          </Space>
        }
      />

      <Flex wrap gap={12} style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Cari artikel..."
          style={{ width: 280 }}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Kategori"
          style={{ width: 180 }}
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'published', label: 'Tayang' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Diarsipkan' },
          ]}
        />
      </Flex>

      <Table<AdminArticleListItem>
        rowKey="id"
        loading={listQuery.isLoading}
        dataSource={items}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={[
          {
            title: 'Judul',
            key: 'title',
            render: (_, row) => (
              <Space orientation="vertical" size={2}>
                <Typography.Text strong>{row.title}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  slug: {row.slug}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: 'Kategori',
            key: 'category',
            width: 150,
            render: (_, row) => <Tag>{row.category?.name ?? row.category?.id ?? '-'}</Tag>,
          },
          {
            title: 'Tag',
            key: 'tags',
            width: 200,
            render: (_, row) =>
              row.tags?.length ? (
                <Space wrap size={[0, 4]}>
                  {row.tags.map((t) => (
                    <Tag key={t} bordered={false}>
                      {t}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">-</Typography.Text>
              ),
          },
          {
            title: 'Status',
            key: 'status',
            width: 110,
            render: (_, row) => (
              <Tag color={ARTICLE_STATUS_COLOR[row.status]}>{ARTICLE_STATUS_LABEL[row.status]}</Tag>
            ),
          },
          {
            title: 'Penulis',
            key: 'author',
            width: 140,
            render: (_, row) => row.author?.display_name ?? row.author?.username ?? '-',
          },
          {
            title: '',
            key: 'actions',
            width: 130,
            render: (_, row) => (
              <Space size={4}>
                <Tooltip title="Riwayat revisi">
                  <Button
                    size="small"
                    type="text"
                    icon={<HistoryOutlined />}
                    onClick={() => setRevisionsArticleId(row.id)}
                  />
                </Tooltip>
                <Tooltip title="Edit artikel">
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    disabled={!canManage}
                    onClick={() => {
                      setEditingArticle(row);
                      setDrawerOpen(true);
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title={`Arsipkan artikel "${row.title}"?`}
                  description="Artikel ditarik dari tayang dan diarsipkan."
                  okText="Arsipkan"
                  okButtonProps={{ danger: true }}
                  cancelText="Batal"
                  onConfirm={() => onDelete(row)}
                  disabled={!canManage || row.status === 'archived'}
                >
                  <Tooltip title="Arsipkan artikel">
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={!canManage || row.status === 'archived'}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <ArticleDrawer
        open={drawerOpen}
        article={editingArticle}
        categoryOptions={categoryOptions}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          void listQuery.refetch();
        }}
      />

      {revisionsArticleId ? (
        <ArticleRevisionsDrawer
          articleId={revisionsArticleId}
          open={Boolean(revisionsArticleId)}
          onClose={() => setRevisionsArticleId(null)}
          onRestored={() => {
            setRevisionsArticleId(null);
            void listQuery.refetch();
          }}
        />
      ) : null}
    </>
  );
}