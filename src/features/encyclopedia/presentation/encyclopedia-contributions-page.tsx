import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Drawer,
  Flex,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAdminContributionsRequest,
  reviewContributionRequest,
} from '../infrastructure/encyclopedia-api';
import {
  CONTRIBUTION_STATUS_COLOR,
  CONTRIBUTION_STATUS_LABEL,
  type ArticleContribution,
  type ContributionStatus,
} from '../domain/encyclopedia';

export function EncyclopediaContributionsPage() {
  const { user } = useAuth();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'admin' || user?.role === 'root' || user?.role === 'reviewer';

  const [statusFilter, setStatusFilter] = useState<ContributionStatus | undefined>('pending');
  const [selectedContribution, setSelectedContribution] = useState<ArticleContribution | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'needs_revision' | 'reject'>('approve');
  const [revisionNote, setRevisionNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ['encyclopedia', 'contributions', statusFilter],
    queryFn: ({ signal }) => listAdminContributionsRequest({ status: statusFilter, limit: 50 }, signal),
  });

  const items = query.data?.items ?? [];

  const handleReview = async () => {
    if (!selectedContribution) return;
    setBusy(true);
    try {
      await reviewContributionRequest(selectedContribution.id, {
        decision,
        revision_note: decision === 'needs_revision' ? revisionNote.trim() : null,
        reject_reason_text: decision === 'reject' ? rejectReason.trim() : null,
      });
      message.success('Keputusan usulan disimpan');
      setReviewOpen(false);
      setSelectedContribution(null);
      void queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'contributions'] });
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Antrean Usulan Artikel"
        subtitle="Review usulan artikel baru dan perubahan dari kontributor masyarakat."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Muat ulang
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          value={statusFilter}
          style={{ width: 180 }}
          allowClear
          placeholder="Semua status"
          onChange={setStatusFilter}
          options={[
            { value: 'pending', label: 'Menunggu' },
            { value: 'needs_revision', label: 'Perlu revisi' },
            { value: 'approved', label: 'Disetujui' },
            { value: 'rejected', label: 'Ditolak' },
          ]}
        />
      </Space>

      <Table<ArticleContribution>
        rowKey="id"
        loading={query.isLoading}
        dataSource={items}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={[
          {
            title: 'Jenis',
            key: 'kind',
            width: 90,
            render: (_, row) => (
              <Tag color={row.kind === 'new' ? 'blue' : 'purple'}>
                {row.kind === 'new' ? 'Baru' : 'Edit'}
              </Tag>
            ),
          },
          {
            title: 'Judul yang Diusulkan',
            key: 'title',
            render: (_, row) => (
              <Space direction="vertical" size={2}>
                <Typography.Text strong>{row.payload?.title ?? '-'}</Typography.Text>
                {row.article ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Artikel terkait: {row.article.title ?? row.article.slug}
                  </Typography.Text>
                ) : null}
              </Space>
            ),
          },
          {
            title: 'Kategori',
            key: 'category',
            width: 140,
            render: (_, row) => <Tag>{row.payload?.category_id ?? '-'}</Tag>,
          },
          {
            title: 'Status',
            key: 'status',
            width: 120,
            render: (_, row) => (
              <Tag color={CONTRIBUTION_STATUS_COLOR[row.status]}>
                {CONTRIBUTION_STATUS_LABEL[row.status]}
              </Tag>
            ),
          },
          {
            title: 'Tanggal Usulan',
            key: 'created_at',
            width: 160,
            render: (_, row) => formatDateTime(row.created_at),
          },
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_, row) => (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setSelectedContribution(row);
                  setDecision('approve');
                  setRevisionNote('');
                  setRejectReason('');
                }}
              >
                Tinjau
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title="Detail Usulan Artikel"
        open={selectedContribution != null && !reviewOpen}
        onClose={() => setSelectedContribution(null)}
        width={680}
        destroyOnClose
        extra={
          canManage && selectedContribution?.status === 'pending' ? (
            <Button type="primary" onClick={() => setReviewOpen(true)}>
              Ambil Keputusan
            </Button>
          ) : null
        }
      >
        {selectedContribution ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Flex orientation="vertical" gap={4}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {selectedContribution.payload?.title}
              </Typography.Title>
              <Space wrap>
                <Tag color={selectedContribution.kind === 'new' ? 'blue' : 'purple'}>
                  {selectedContribution.kind === 'new' ? 'Artikel Baru' : 'Usulan Perubahan'}
                </Tag>
                <Tag>{selectedContribution.payload?.category_id}</Tag>
                <Tag color={CONTRIBUTION_STATUS_COLOR[selectedContribution.status]}>
                  {CONTRIBUTION_STATUS_LABEL[selectedContribution.status]}
                </Tag>
              </Space>
            </Flex>

            {selectedContribution.revision_note ? (
              <div style={{ background: '#fffbe6', padding: 12, borderRadius: 6, border: '1px solid #ffe58f' }}>
                <Typography.Text strong style={{ color: '#d46b08' }}>Catatan revisi sebelumnya:</Typography.Text>
                <div>{selectedContribution.revision_note}</div>
              </div>
            ) : null}

            {selectedContribution.reject_reason_text ? (
              <div style={{ background: '#fff1f0', padding: 12, borderRadius: 6, border: '1px solid #ffa39e' }}>
                <Typography.Text strong style={{ color: '#cf1322' }}>Alasan penolakan:</Typography.Text>
                <div>{selectedContribution.reject_reason_text}</div>
              </div>
            ) : null}

            <div>
              <Typography.Text strong>Ringkasan:</Typography.Text>
              <Typography.Paragraph type="secondary">
                {selectedContribution.payload?.excerpt || '-'}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text strong>Tag:</Typography.Text>
              <div style={{ marginTop: 4 }}>
                {selectedContribution.payload?.tags?.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </div>

            <div>
              <Typography.Text strong>Isi Usulan (Markdown):</Typography.Text>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  maxHeight: 360,
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedContribution.payload?.body_md}
              </div>
            </div>

            {selectedContribution.payload?.references_md ? (
              <div>
                <Typography.Text strong>Referensi:</Typography.Text>
                <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {selectedContribution.payload.references_md}
                </div>
              </div>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Keputusan Review Usulan"
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={handleReview}
        okText="Kirim keputusan"
        cancelText="Batal"
        confirmLoading={busy}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group value={decision} onChange={(e) => setDecision(e.target.value)}>
            <Space direction="vertical">
              <Radio value="approve">Setujui & Publikasikan artikel</Radio>
              <Radio value="needs_revision">Minta Kontributor Revisi</Radio>
              <Radio value="reject">Tolak Usulan</Radio>
            </Space>
          </Radio.Group>

          {decision === 'needs_revision' ? (
            <Input.TextArea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Jelaskan hal apa yang perlu diperbaiki oleh pengusul..."
              maxLength={500}
              showCount
              rows={3}
            />
          ) : null}

          {decision === 'reject' ? (
            <Input.TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan usulan artikel..."
              maxLength={500}
              showCount
              rows={3}
            />
          ) : null}
        </Space>
      </Modal>
    </>
  );
}