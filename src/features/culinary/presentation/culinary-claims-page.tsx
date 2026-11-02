import { useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import { ReloadOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Flex,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import type { CulinaryClaim, CulinaryClaimStatus } from '../domain/culinary';
import { useCulinaryClaims, useReviewCulinaryClaim } from '../application/use-culinary';
import { CULINARY_CLAIM_REJECT_OPTIONS } from '../infrastructure/culinary-moderation-api';

const columnHelper = createColumnHelper<typeof tableFeatureSet, CulinaryClaim>();

const STATUS_LABEL: Record<CulinaryClaimStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

const STATUS_COLOR: Record<CulinaryClaimStatus, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
};

export function CulinaryClaimsPage() {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<CulinaryClaimStatus>('pending');
  const [selected, setSelected] = useState<CulinaryClaim | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState('evidence_insufficient');
  const [reasonText, setReasonText] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const claims = useCulinaryClaims({ status });
  const review = useReviewCulinaryClaim();

  const approve = async (claim: CulinaryClaim) => {
    setBusy('approve');
    try {
      await review.mutateAsync({ id: claim.id, action: 'approve' });
      message.success('Klaim disetujui - pengelola terhubung ke tempat');
      setSelected(null);
      void claims.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const submitReject = async () => {
    if (!selected) return;
    const trimmed = reasonText.trim();
    if (reasonCode === 'other' && trimmed.length < 3) {
      message.warning('Tulis alasan spesifik (min 3 karakter).');
      return;
    }
    setBusy('reject');
    try {
      await review.mutateAsync({
        id: selected.id,
        action: 'reject',
        reason: { reason_code: reasonCode, reason_text: trimmed || null },
      });
      message.success('Klaim ditolak');
      setSelected(null);
      setRejectOpen(false);
      setReasonText('');
      void claims.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const columns = columnHelper.columns([
    columnHelper.accessor('placeName', {
      header: 'Tempat',
      size: 240,
      cell: (info) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>
            {info.getValue() ?? info.row.original.placeId}
          </Typography.Text>
          <Typography.Text type="secondary">{info.row.original.placeSlug ?? '-'}</Typography.Text>
        </Space>
      ),
    }),
    columnHelper.accessor('note', {
      header: 'Catatan pemohon',
      size: 260,
      cell: (info) => (
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
          {info.getValue() ?? '-'}
        </Typography.Paragraph>
      ),
    }),
    columnHelper.display({
      id: 'evidence',
      header: 'Bukti',
      size: 110,
      cell: (info) =>
        info.row.original.contactEvidence ? (
          <Tag color="blue">Ada</Tag>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 120,
      cell: (info) => (
        <Tag color={STATUS_COLOR[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</Tag>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Diajukan',
      size: 160,
      cell: (info) => formatDateTime(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      size: 110,
      meta: { fixed: 'right' },
      cell: (info) => (
        <Button type="link" onClick={() => setSelected(info.row.original)}>
          Tinjau
        </Button>
      ),
    }),
  ]);

  const table = useTable({
    features: tableFeatureSet,
    data: claims.data ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <>
      <PageHeader
        title="Klaim tempat kuliner"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void claims.refetch()}>
            Muat ulang
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          value={status}
          style={{ width: 170 }}
          onChange={(v) => setStatus(v)}
          options={(Object.keys(STATUS_LABEL) as CulinaryClaimStatus[]).map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
        />
      </Space>

      {claims.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat klaim"
          description={normalizeError(claims.error).message}
        />
      ) : null}

      <DataTable table={table} rowKey={(record) => record.id} loading={claims.isLoading} />
      <Flex justify="center" style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{(claims.data ?? []).length} klaim</Typography.Text>
      </Flex>

      <Drawer
        title="Tinjau klaim"
        open={selected != null}
        onClose={() => setSelected(null)}
        width={560}
        destroyOnHidden
        extra={
          selected?.status === 'pending' ? (
            <Space>
              <Button danger loading={busy === 'reject'} onClick={() => setRejectOpen(true)}>
                Tolak
              </Button>
              <Button
                type="primary"
                loading={busy === 'approve'}
                onClick={() => selected && void approve(selected)}
              >
                Setujui
              </Button>
            </Space>
          ) : null
        }
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {selected.placeName ?? selected.placeId}
            </Typography.Title>
            <Space wrap>
              <Tag color={STATUS_COLOR[selected.status]}>{STATUS_LABEL[selected.status]}</Tag>
              {selected.placeSlug ? <Tag>{selected.placeSlug}</Tag> : null}
            </Space>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Diajukan">
                {formatDateTime(selected.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Pemohon (user id)">
                {selected.userId ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Catatan pemohon">
                {selected.note ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Bukti kontak">
                <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {selected.contactEvidence ?? '-'}
                </Typography.Paragraph>
              </Descriptions.Item>
              {selected.rejectReasonCode ? (
                <Descriptions.Item label="Alasan penolakan">
                  {selected.rejectReasonText ?? selected.rejectReasonCode}
                </Descriptions.Item>
              ) : null}
            </Descriptions>
            <Alert
              type="warning"
              showIcon
              message="Bukti kontak bersifat privat"
              description="Jangan salin ke tempat publik atau bagikan di luar panel admin."
            />
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Alasan penolakan klaim"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={submitReject}
        okText="Tolak klaim"
        okButtonProps={{ danger: true, loading: busy === 'reject' }}
        cancelText="Batal"
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
            <Space direction="vertical">
              {CULINARY_CLAIM_REJECT_OPTIONS.map((r) => (
                <Radio key={r.code} value={r.code}>
                  {r.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
          <Input.TextArea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder={
              reasonCode === 'other'
                ? 'Wajib: tulis alasan spesifik untuk pemohon'
                : 'Opsional: catatan tambahan untuk pemohon'
            }
            maxLength={1000}
            showCount
            rows={3}
          />
        </Space>
      </Modal>
    </>
  );
}
