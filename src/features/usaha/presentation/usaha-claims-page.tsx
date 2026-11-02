import { useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import { ReloadOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
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
import type { UsahaClaim, UsahaClaimStatus } from '../domain/usaha';
import { useReviewUsahaClaim, useUsahaClaims } from '../application/use-usaha';
import { USAHA_CLAIM_REJECT_OPTIONS } from '../infrastructure/usaha-moderation-api';

const columnHelper = createColumnHelper<typeof tableFeatureSet, UsahaClaim>();

const STATUS_COLOR: Record<UsahaClaimStatus, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
};

const STATUS_LABEL: Record<UsahaClaimStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

export function UsahaClaimsPage() {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<UsahaClaimStatus>('pending');
  const [selected, setSelected] = useState<UsahaClaim | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState('evidence_insufficient');
  const [reasonText, setReasonText] = useState('');
  const [busy, setBusy] = useState(false);

  const claims = useUsahaClaims({ status });
  const review = useReviewUsahaClaim();

  const run = async (action: 'approve' | 'reject', reason?: { reason_code: string; reason_text?: string }) => {
    if (!selected) return;
    setBusy(true);
    try {
      await review.mutateAsync({ id: selected.id, action, reason });
      message.success(action === 'approve' ? 'Klaim disetujui' : 'Klaim ditolak');
      setSelected(null);
      void claims.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  /** Klaim pending lain untuk usaha yang sama - ditolak otomatis saat approve. */
  const competitors = (claims.data ?? []).filter(
    (c) =>
      selected != null &&
      c.id !== selected.id &&
      c.usahaId === selected.usahaId &&
      c.status === 'pending',
  );

  const columns = columnHelper.columns([
    columnHelper.accessor('usahaName', {
      header: 'Usaha',
      size: 220,
      cell: (info) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{info.getValue() ?? info.row.original.usahaId}</Typography.Text>
          <Typography.Text type="secondary">{info.row.original.usahaSlug ?? '-'}</Typography.Text>
        </Space>
      ),
    }),
    columnHelper.accessor('contactEvidence', {
      header: 'Bukti kontak',
      size: 280,
      cell: (info) => (
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
          {info.getValue() ?? '-'}
        </Typography.Paragraph>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 110,
      cell: (info) => <Tag color={STATUS_COLOR[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</Tag>,
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
        title="Klaim pengelola usaha"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void claims.refetch()}>
            Muat ulang
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          value={status}
          style={{ width: 160 }}
          onChange={(v) => setStatus(v)}
          options={(Object.keys(STATUS_LABEL) as UsahaClaimStatus[]).map((s) => ({
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
              <Button
                danger
                loading={busy}
                onClick={() => {
                  setReasonCode('evidence_insufficient');
                  setReasonText('');
                  setRejectOpen(true);
                }}
              >
                Tolak
              </Button>
              <Button type="primary" loading={busy} onClick={() => void run('approve')}>
                Setujui
              </Button>
            </Space>
          ) : null
        }
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {selected.usahaName ?? selected.usahaId}
            </Typography.Title>
            <Tag color={STATUS_COLOR[selected.status]}>{STATUS_LABEL[selected.status]}</Tag>
            <div>
              <Typography.Text type="secondary">Bukti kontak (privat)</Typography.Text>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {selected.contactEvidence ?? '-'}
              </Typography.Paragraph>
            </div>
            <div>
              <Typography.Text type="secondary">Catatan pengaju</Typography.Text>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {selected.note ?? '-'}
              </Typography.Paragraph>
            </div>
            <Typography.Text type="secondary">
              Diajukan {formatDateTime(selected.createdAt)}
            </Typography.Text>

            {competitors.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                message={`${competitors.length} klaim pending lain untuk usaha ini`}
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text>
                      Kalau klaim ini disetujui, klaim lain otomatis ditolak (CLAIM_CONFLICT).
                    </Typography.Text>
                    {competitors.map((c) => (
                      <Typography.Text key={c.id} type="secondary">
                        {c.contactEvidence ?? '-'}
                      </Typography.Text>
                    ))}
                  </Space>
                }
              />
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Alasan penolakan klaim"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => {
          if (reasonCode === 'other' && reasonText.trim().length < 3) {
            message.warning('Tulis alasan spesifik (min 3 karakter).');
            return;
          }
          void run('reject', {
            reason_code: reasonCode,
            reason_text: reasonText.trim() || undefined,
          });
          setRejectOpen(false);
        }}
        okText="Tolak klaim"
        okButtonProps={{ danger: true, loading: busy }}
        cancelText="Batal"
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
            <Space direction="vertical">
              {USAHA_CLAIM_REJECT_OPTIONS.map((r) => (
                <Radio key={r.code} value={r.code}>
                  {r.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
          <Input.TextArea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Opsional: catatan untuk pengaju"
            maxLength={500}
            showCount
            rows={3}
          />
        </Space>
      </Modal>
    </>
  );
}
