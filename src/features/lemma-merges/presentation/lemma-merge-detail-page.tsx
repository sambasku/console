import { useState } from 'react';
import { App, Button, Card, Descriptions, Input, List, Space, Tag, Typography } from 'antd';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '@/shared/components/page-header';
import { PageLoading } from '@/shared/components/page-loading';
import { formatDateTime } from '@/shared/utils/format-datetime';
import {
  useApproveLemmaMerge,
  useLemmaMergeDetail,
  useRejectLemmaMerge,
} from '../application/use-lemma-merge-actions';
import { LEMMA_MERGE_STATUS_LABELS } from '../domain/lemma-merge';

const STATUS_TAG_COLOR = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
} as const;

export function LemmaMergeDetailPage() {
  const { id } = useParams({ from: '/console-layout/lemma-merges/$id' });
  return <LemmaMergeDetail id={id} key={id} />;
}

function LemmaMergeDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { data, isLoading, isError, error } = useLemmaMergeDetail(id);
  const approve = useApproveLemmaMerge();
  const reject = useRejectLemmaMerge();
  const [note, setNote] = useState('');

  if (isLoading) return <PageLoading tip="Memuat usulan gabung…" />;
  if (isError || !data) {
    return (
      <Typography.Text type="danger">
        {error instanceof Error ? error.message : 'Usulan tidak ditemukan'}
      </Typography.Text>
    );
  }

  const pending = data.status === 'pending';

  const onApprove = () => {
    void modal.confirm({
      title: 'Setujui gabung kata?',
      content: `Lemma utama "${data.keep_lemma}" akan menyerap ${data.merge_words.length} entri lain.`,
      okText: 'Setujui',
      cancelText: 'Batal',
      onOk: async () => {
        await approve.mutateAsync({ id, reviewNote: note.trim() || undefined });
        message.success('Usulan gabung disetujui');
        void navigate({ to: '/lemma-merges' });
      },
    });
  };

  const onReject = () => {
    void modal.confirm({
      title: 'Tolak usulan gabung?',
      okText: 'Tolak',
      okButtonProps: { danger: true },
      cancelText: 'Batal',
      onOk: async () => {
        await reject.mutateAsync({ id, reviewNote: note.trim() || undefined });
        message.success('Usulan gabung ditolak');
        void navigate({ to: '/lemma-merges' });
      },
    });
  };

  return (
    <>
      <PageHeader
        title={`Gabung: ${data.keep_lemma}`}
        subtitle={`Status: ${LEMMA_MERGE_STATUS_LABELS[data.status]}`}
        extra={<Button onClick={() => void navigate({ to: '/lemma-merges' })}>Kembali</Button>}
      />
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Status">
            <Tag color={STATUS_TAG_COLOR[data.status]}>{LEMMA_MERGE_STATUS_LABELS[data.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Pengusul">
            {data.proposer_display_name || data.proposer_username || data.proposer_id}
          </Descriptions.Item>
          <Descriptions.Item label="Diajukan">{formatDateTime(data.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Alasan">
            {data.reason_text?.trim() || '-'}
          </Descriptions.Item>
          {data.review_note ? (
            <Descriptions.Item label="Catatan reviewer">{data.review_note}</Descriptions.Item>
          ) : null}
        </Descriptions>
      </Card>
      <Card title="Lemma utama" style={{ marginBottom: 16 }}>
        <Typography.Text strong>{data.keep_lemma}</Typography.Text>
        <Typography.Text type="secondary"> · {data.keep_word_id}</Typography.Text>
      </Card>
      <Card title="Entri yang digabung" style={{ marginBottom: 16 }}>
        <List
          dataSource={data.merge_words}
          locale={{ emptyText: 'Tidak ada entri' }}
          renderItem={(item) => (
            <List.Item>
              <Typography.Text strong>{item.lemma}</Typography.Text>
              <Typography.Text type="secondary"> · {item.word_id}</Typography.Text>
            </List.Item>
          )}
        />
      </Card>
      {pending ? (
        <Card title="Keputusan">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Input.TextArea
              rows={3}
              maxLength={500}
              placeholder="Catatan untuk pengusul (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Space>
              <Button type="primary" loading={approve.isPending} onClick={onApprove}>
                Setujui gabung
              </Button>
              <Button danger loading={reject.isPending} onClick={onReject}>
                Tolak
              </Button>
            </Space>
          </Space>
        </Card>
      ) : null}
    </>
  );
}