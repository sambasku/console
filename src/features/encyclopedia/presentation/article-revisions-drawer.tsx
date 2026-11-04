import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import { HistoryOutlined, RollbackOutlined } from '@ant-design/icons';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import {
  useArticleRevisions,
  useRestoreArticleRevision,
} from '../application/use-encyclopedia-articles';
import type { ArticleRevision } from '../domain/encyclopedia';

export function ArticleRevisionsDrawer({
  articleId,
  open,
  onClose,
  onRestored,
}: {
  articleId: string;
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}) {
  const { message } = AntdApp.useApp();
  const revisionsQuery = useArticleRevisions(articleId, open);
  const restoreMutation = useRestoreArticleRevision();

  const [selectedRevision, setSelectedRevision] = useState<ArticleRevision | null>(null);

  const items = revisionsQuery.data?.items ?? [];

  const handleRestore = async (rev: ArticleRevision) => {
    try {
      await restoreMutation.mutateAsync({
        articleId,
        revisionId: rev.id,
      });
      message.success(`Artikel dipulihkan ke versi "${rev.title}"`);
      onRestored();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>Riwayat Perubahan Artikel</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={760}
      destroyOnClose
    >
      <Flex gap={16} style={{ height: '100%' }}>
        {/* Kolom kiri: daftar revisi */}
        <div style={{ width: 280, borderRight: '1px solid #f0f0f0', paddingRight: 12, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <Empty description="Belum ada riwayat revisi" />
          ) : (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {items.map((rev) => {
                const isSelected = selectedRevision?.id === rev.id;
                return (
                  <Card
                    key={rev.id}
                    size="small"
                    hoverable
                    onClick={() => setSelectedRevision(rev)}
                    style={{
                      cursor: 'pointer',
                      borderColor: isSelected ? '#1677ff' : undefined,
                      background: isSelected ? '#e6f4ff' : undefined,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Typography.Text strong ellipsis>
                        {rev.title}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(rev.created_at)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Oleh: {rev.editor_username ?? rev.editor_id}
                      </Typography.Text>
                      {rev.change_note ? (
                        <Tag color="blue" style={{ marginTop: 4 }}>
                          {rev.change_note}
                        </Tag>
                      ) : null}
                    </Space>
                  </Card>
                );
              })}
            </Space>
          )}
        </div>

        {/* Kolom kanan: detail snapshot & tombol restore */}
        <div style={{ flex: 1, paddingLeft: 8, overflowY: 'auto' }}>
          {selectedRevision ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Flex justify="space-between" align="center">
                <div>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {selectedRevision.title}
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Snapshot {formatDateTime(selectedRevision.created_at)}
                  </Typography.Text>
                </div>
                <Popconfirm
                  title="Pulihkan ke versi ini?"
                  description="Isi artikel akan diganti dengan snapshot ini dan dicatat sebagai revisi baru."
                  okText="Pulihkan"
                  cancelText="Batal"
                  onConfirm={() => handleRestore(selectedRevision)}
                >
                  <Button
                    type="primary"
                    icon={<RollbackOutlined />}
                    loading={restoreMutation.isPending}
                  >
                    Pulihkan versi ini
                  </Button>
                </Popconfirm>
              </Flex>

              <div>
                <Typography.Text strong>Ringkasan:</Typography.Text>
                <Typography.Paragraph type="secondary">
                  {selectedRevision.excerpt || '-'}
                </Typography.Paragraph>
              </div>

              <div>
                <Typography.Text strong>Kategori & Tag:</Typography.Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="cyan">{selectedRevision.category_id}</Tag>
                  {selectedRevision.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>

              <div>
                <Typography.Text strong>Isi Markdown:</Typography.Text>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: '#fafafa',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    maxHeight: 320,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedRevision.body_md}
                </div>
              </div>
            </Space>
          ) : (
            <Empty description="Pilih versi revisi di sebelah kiri untuk melihat isi" />
          )}
        </div>
      </Flex>
    </Drawer>
  );
}