import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Image,
  Input,
  Modal,
  Radio,
  Space,
  Tag,
  Typography,
} from 'antd';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import type { UsahaContribution } from '../domain/usaha';
import {
  USAHA_CONTRIBUTION_KIND_LABEL,
  USAHA_CONTRIBUTION_REJECT_REASON_OPTIONS,
  USAHA_FIELD_LABEL,
  type UsahaContributionRejectReasonCode,
} from '../infrastructure/usaha-contribution-api';

function textOrDash(value: unknown): string {
  if (value == null) return '-';
  const s = String(value).trim();
  return s ? s : '-';
}

/** Nilai payload untuk diff - objek/array di-JSON-kan ringkas. */
function displayValue(value: unknown): string {
  if (value == null) return '-';
  if (Array.isArray(value)) return `${value.length} entri`;
  if (typeof value === 'object') return JSON.stringify(value);
  return textOrDash(value);
}

export function UsahaProposalDrawer({
  proposal,
  onClose,
  onReviewed,
  review,
}: {
  proposal: UsahaContribution | null;
  onClose: () => void;
  onReviewed: () => void;
  review: (params: {
    id: string;
    action: 'approve' | 'reject' | 'request-revision';
    reason?: { reason_code: string; reason_text?: string };
    note?: string;
  }) => Promise<unknown>;
}) {
  const { message } = AntdApp.useApp();
  const [busy, setBusy] = useState<'approve' | 'reject' | 'request-revision' | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reasonCode, setReasonCode] =
    useState<UsahaContributionRejectReasonCode>('duplicate');
  const [reasonText, setReasonText] = useState('');
  const [revisionNote, setRevisionNote] = useState('');

  const payload = proposal?.payload ?? {};
  const fields = proposal?.fields ?? [];

  const run = async (
    action: 'approve' | 'reject' | 'request-revision',
    extra?: { reason_code: string; reason_text?: string } | { note: string },
  ) => {
    if (!proposal) return;
    setBusy(action);
    try {
      await review({ id: proposal.id, action, ...(extra as object) });
      message.success(
        action === 'approve'
          ? 'Pengajuan disetujui'
          : action === 'reject'
            ? 'Pengajuan ditolak'
            : 'Catatan revisi terkirim',
      );
      onReviewed();
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const submitReject = () => {
    const trimmed = reasonText.trim();
    if (reasonCode === 'other' && trimmed.length < 3) {
      message.warning('Tulis alasan spesifik (min 3 karakter).');
      return;
    }
    void run('reject', {
      reason_code: reasonCode,
      reason_text: trimmed || undefined,
    });
    setRejectOpen(false);
  };

  const submitRevision = () => {
    const trimmed = revisionNote.trim();
    if (trimmed.length < 3) {
      message.warning('Tulis catatan revisi (min 3 karakter).');
      return;
    }
    void run('request-revision', { note: trimmed });
    setRevisionOpen(false);
  };

  const isNew = proposal?.kind === 'new';

  return (
    <Drawer
      title="Pratinjau pengajuan usaha"
      open={proposal != null}
      onClose={onClose}
      size="large"
      destroyOnHidden
      extra={
        <Space>
          <Button loading={busy === 'request-revision'} disabled={busy != null} onClick={() => setRevisionOpen(true)}>
            Minta revisi
          </Button>
          <Button danger loading={busy === 'reject'} disabled={busy != null} onClick={() => setRejectOpen(true)}>
            Tolak
          </Button>
          <Button
            type="primary"
            loading={busy === 'approve'}
            disabled={busy != null}
            onClick={() => void run('approve')}
          >
            Setujui
          </Button>
        </Space>
      }
    >
      {proposal ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={isNew ? 'green' : 'blue'}>
              {USAHA_CONTRIBUTION_KIND_LABEL[proposal.kind]}
            </Tag>
            {proposal.wantsClaim ? <Tag color="gold">Menandai usaha sendiri</Tag> : null}
            {proposal.usahaSlug ? <Tag>{proposal.usahaSlug}</Tag> : null}
          </Space>

          <Typography.Title level={4} style={{ margin: 0 }}>
            {textOrDash(payload.name) !== '-' ? textOrDash(payload.name) : proposal.usahaName ?? 'Pengajuan'}
          </Typography.Title>

          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Usaha">{textOrDash(proposal.usahaName)}</Descriptions.Item>
            <Descriptions.Item label="Field diajukan">
              {fields.length > 0
                ? fields.map((f) => (
                    <Tag key={f}>{USAHA_FIELD_LABEL[f] ?? f}</Tag>
                  ))
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Dikirim">{formatDateTime(proposal.createdAt)}</Descriptions.Item>
            {proposal.revisionNote ? (
              <Descriptions.Item label="Catatan revisi">{proposal.revisionNote}</Descriptions.Item>
            ) : null}
          </Descriptions>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Isi pengajuan
          </Typography.Title>
          <Descriptions size="small" column={1} bordered>
            {Object.entries(payload).map(([key, value]) => (
              <Descriptions.Item key={key} label={USAHA_FIELD_LABEL[key] ?? key}>
                {key === 'coverUrl' && typeof value === 'string' ? (
                  <Image src={value} width={160} style={{ borderRadius: 8 }} />
                ) : key === 'items' && Array.isArray(value) ? (
                  <Space direction="vertical" size={2}>
                    {value.map((it, idx) => (
                      <Typography.Text key={idx}>
                        {(it as { name?: string }).name ?? '-'}
                        {(it as { priceText?: string }).priceText
                          ? ` - ${(it as { priceText?: string }).priceText}`
                          : ''}
                      </Typography.Text>
                    ))}
                  </Space>
                ) : (
                  displayValue(value)
                )}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Space>
      ) : null}

      <Modal
        title="Alasan penolakan"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={submitReject}
        okText="Tolak pengajuan"
        okButtonProps={{ danger: true, loading: busy === 'reject' }}
        cancelText="Batal"
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
            <Space direction="vertical">
              {USAHA_CONTRIBUTION_REJECT_REASON_OPTIONS.map((r) => (
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
                ? 'Wajib: tulis alasan spesifik untuk pengusul'
                : 'Opsional: catatan tambahan untuk pengusul'
            }
            maxLength={500}
            showCount
            rows={3}
          />
        </Space>
      </Modal>

      <Modal
        title="Minta revisi"
        open={revisionOpen}
        onCancel={() => setRevisionOpen(false)}
        onOk={submitRevision}
        okText="Kirim catatan"
        cancelText="Batal"
        destroyOnHidden
      >
        <Input.TextArea
          value={revisionNote}
          onChange={(e) => setRevisionNote(e.target.value)}
          placeholder="Ceritakan bagian yang perlu diperbaiki, biar pengusul paham."
          maxLength={1000}
          showCount
          rows={4}
        />
      </Modal>
    </Drawer>
  );
}
