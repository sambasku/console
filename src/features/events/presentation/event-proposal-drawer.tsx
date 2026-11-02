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
import { withSambaskuUtm } from '@/shared/utils/external-link';
import type { EventContribution } from '../domain/event';
import {
  EVENT_REJECT_REASON_OPTIONS,
  type EventContributionRejectReasonCode,
} from '../infrastructure/event-contribution-api';

function textOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
}

export function EventProposalDrawer({
  proposal,
  categoryName,
  regionName,
  onClose,
  onReviewed,
  review,
}: {
  proposal: EventContribution | null;
  categoryName: (id: string) => string;
  regionName: (id: string | null) => string;
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
  const [reasonCode, setReasonCode] = useState<EventContributionRejectReasonCode>('not_suitable');
  const [reasonText, setReasonText] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const payload = proposal?.payload;

  const run = async (
    action: 'approve' | 'reject' | 'request-revision',
    extra?: { reason_code: string; reason_text?: string } | { note: string },
  ) => {
    if (!proposal || busy) return;
    setBusy(action);
    try {
      await review({
        id: proposal.id,
        action,
        ...(action === 'reject'
          ? { reason: extra as { reason_code: string; reason_text?: string } }
          : action === 'request-revision'
            ? { note: (extra as { note: string }).note }
            : {}),
      });
      message.success(
        action === 'approve'
          ? 'Usulan disetujui - acara sudah tayang'
          : action === 'reject'
            ? 'Usulan ditolak'
            : 'Permintaan revisi terkirim',
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
      ...(trimmed ? { reason_text: trimmed } : {}),
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

  return (
    <Drawer
      title="Pratinjau usulan acara"
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
      {proposal && payload ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color="green">Acara baru</Tag>
            {payload.category_id ? <Tag>{categoryName(payload.category_id)}</Tag> : null}
          </Space>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {payload.name}
          </Typography.Title>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Deskripsi">{textOrDash(payload.description)}</Descriptions.Item>
            <Descriptions.Item label="Mulai">{formatDateTime(payload.starts_at)}</Descriptions.Item>
            <Descriptions.Item label="Selesai">{formatDateTime(payload.ends_at)}</Descriptions.Item>
            <Descriptions.Item label="Lokasi">{textOrDash(payload.location_text)}</Descriptions.Item>
            <Descriptions.Item label="Kecamatan">{regionName(payload.region_id)}</Descriptions.Item>
            <Descriptions.Item label="Desa">{regionName(payload.village_id)}</Descriptions.Item>
            <Descriptions.Item label="Koordinat">
              {payload.lat != null && payload.lng != null ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${payload.lat},${payload.lng}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {payload.lat}, {payload.lng}
                </a>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Penyelenggara">{textOrDash(payload.organizer)}</Descriptions.Item>
            <Descriptions.Item label="Link sumber">
              {payload.source_url ? (
                <a
                  href={withSambaskuUtm(payload.source_url)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {payload.source_url}
                </a>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Kredit sumber">{textOrDash(payload.source_attribution)}</Descriptions.Item>
            <Descriptions.Item label="Dikirim">{formatDateTime(proposal.createdAt)}</Descriptions.Item>
          </Descriptions>
          {payload.poster_urls.length > 0 ? (
            <>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Poster ({payload.poster_urls.length})
              </Typography.Title>
              <Image.PreviewGroup>
                <Space wrap>
                  {payload.poster_urls.map((url) => (
                    <Image
                      key={url}
                      src={url}
                      alt={payload.name}
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </>
          ) : null}
        </Space>
      ) : null}

      <Modal
        title="Alasan penolakan"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={submitReject}
        okText="Tolak usulan"
        okButtonProps={{ danger: true, loading: busy === 'reject' }}
        cancelText="Batal"
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
            <Space direction="vertical">
              {EVENT_REJECT_REASON_OPTIONS.map((r) => (
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
