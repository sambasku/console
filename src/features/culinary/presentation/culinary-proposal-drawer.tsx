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
import type { CulinaryContribution } from '../domain/culinary';
import type { CuisineInput } from '../infrastructure/culinary-api';
import { CuisineImagesField } from './culinary-drawer';
import {
  CULINARY_CONTRIBUTION_KIND_LABEL,
  CULINARY_CONTRIBUTION_REJECT_REASON_OPTIONS,
  CULINARY_FIELD_LABEL,
  type CulinaryContributionRejectReasonCode,
} from '../infrastructure/culinary-contribution-api';

function textOrDash(value: unknown): string {
  if (value == null) return '-';
  const s = String(value).trim();
  return s ? s : '-';
}

function isImageList(value: unknown): value is Array<{ url: string; attribution?: unknown }> {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => typeof v === 'object' && v != null && 'url' in (v as object))
  );
}

function ValueCell({ field, value }: { field: string; value: unknown }) {
  if (value == null || value === '') return <>-</>;
  if (field === 'coverUrl' && typeof value === 'string') {
    return <Image src={value} width={160} style={{ borderRadius: 8 }} />;
  }
  if (isImageList(value)) {
    return (
      <Space direction="vertical" size={8}>
        {value.map((img, idx) => {
          const attr = (img.attribution ?? null) as {
            name?: string;
            provider?: string;
            license?: string;
            url?: string;
          } | null;
          return (
            <Space key={`${img.url}-${idx}`} align="start">
              <Image src={img.url} width={120} style={{ borderRadius: 6 }} />
              <Space direction="vertical" size={0}>
                <Typography.Text>{attr?.name ?? attr?.provider ?? 'Tanpa atribusi'}</Typography.Text>
                <Typography.Text type="secondary">{attr?.license ?? '-'}</Typography.Text>
                {attr?.url ? (
                  <Typography.Link href={attr.url} target="_blank" rel="noreferrer">
                    Sumber
                  </Typography.Link>
                ) : null}
              </Space>
            </Space>
          );
        })}
      </Space>
    );
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <>-</>;
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return <>{value.join(', ')}</>;
    }
    return (
      <Space direction="vertical" size={2}>
        {value.map((v, idx) => (
          <Typography.Text key={idx}>
            {typeof v === 'object' && v != null
              ? ((v as { name?: string }).name ?? JSON.stringify(v))
              : String(v)}
          </Typography.Text>
        ))}
      </Space>
    );
  }
  if (typeof value === 'object') {
    return (
      <Typography.Text code style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(value, null, 2)}
      </Typography.Text>
    );
  }
  return <>{String(value)}</>;
}

export function CulinaryProposalDrawer({
  proposal,
  onClose,
  onReviewed,
  review,
}: {
  proposal: CulinaryContribution | null;
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
    useState<CulinaryContributionRejectReasonCode>('incomplete');
  const [reasonText, setReasonText] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  // Foto yang boleh disunting admin sebelum usulan tayang (PRD kuliner).
  const [imageDraft, setImageDraft] = useState<CuisineInput['images']>();

  const payload = proposal?.payload ?? {};
  const fields = proposal?.fields ?? [];

  const run = async (
    action: 'approve' | 'reject' | 'request-revision',
    extra?: { reason_code: string; reason_text?: string } | { note: string },
  ) => {
    if (!proposal) return;
    setBusy(action);
    try {
      await review({
        id: proposal.id,
        action,
        ...(extra as object),
        ...(action === 'approve' && imageDraft !== undefined
          ? { images: imageDraft }
          : {}),
      });
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
    void run('reject', { reason_code: reasonCode, reason_text: trimmed || undefined });
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

  const isNew =
    proposal?.kind === 'new_cuisine' || proposal?.kind === 'new_place';

  return (
    <Drawer
      title="Pratinjau pengajuan kuliner"
      open={proposal != null}
      onClose={onClose}
      size="large"
      destroyOnHidden
      extra={
        <Space>
          <Button
            loading={busy === 'request-revision'}
            disabled={busy != null}
            onClick={() => setRevisionOpen(true)}
          >
            Minta revisi
          </Button>
          <Button
            danger
            loading={busy === 'reject'}
            disabled={busy != null}
            onClick={() => setRejectOpen(true)}
          >
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
              {CULINARY_CONTRIBUTION_KIND_LABEL[proposal.kind]}
            </Tag>
            {proposal.cuisineSlug ? <Tag>{proposal.cuisineSlug}</Tag> : null}
            {proposal.placeSlug ? <Tag>{proposal.placeSlug}</Tag> : null}
          </Space>

          <Typography.Title level={4} style={{ margin: 0 }}>
            {textOrDash(payload.name) !== '-'
              ? textOrDash(payload.name)
              : proposal.cuisineName ?? proposal.placeName ?? 'Pengajuan'}
          </Typography.Title>

          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Kuliner">
              {proposal.cuisineName ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tempat">
              {proposal.placeName ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Field diajukan">
              {fields.length > 0
                ? fields.map((f) => <Tag key={f}>{CULINARY_FIELD_LABEL[f] ?? f}</Tag>)
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Dikirim">
              {formatDateTime(proposal.createdAt)}
            </Descriptions.Item>
            {proposal.revisionNote ? (
              <Descriptions.Item label="Catatan revisi">
                {proposal.revisionNote}
              </Descriptions.Item>
            ) : null}
            {proposal.rejectReasonCode ? (
              <Descriptions.Item label="Alasan penolakan lalu">
                {proposal.rejectReasonText ?? proposal.rejectReasonCode}
              </Descriptions.Item>
            ) : null}
          </Descriptions>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Isi pengajuan
          </Typography.Title>
          <Descriptions size="small" column={1} bordered>
            {Object.entries(payload).map(([key, value]) => (
              <Descriptions.Item key={key} label={CULINARY_FIELD_LABEL[key] ?? key}>
                <ValueCell field={key} value={value} />
              </Descriptions.Item>
            ))}
          </Descriptions>
          {/* Foto warga otomatis CC BY-SA atas nama pengunggah. Admin boleh
              hapus/ganti sebelum setujui - atribusi nama wajib tetap ada. */}
          {isImageList(payload.images) || imageDraft !== undefined ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Foto yang akan tayang
              </Typography.Title>
              <Typography.Text type="secondary">
                Hapus foto yang tidak layak, atau ganti dengan unggahan baru. Atribusi nama wajib
                diisi.
              </Typography.Text>
              <CuisineImagesField
                value={
                  imageDraft ??
                  (isImageList(payload.images)
                    ? (payload.images as NonNullable<CuisineInput['images']>)
                    : [])
                }
                onChange={setImageDraft}
              />
            </Space>
          ) : null}
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
              {CULINARY_CONTRIBUTION_REJECT_REASON_OPTIONS.map((r) => (
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
            maxLength={1000}
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
