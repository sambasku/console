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
import { withSambaskuUtm } from '@/shared/utils/external-link';
import { formatDateTime } from '@/shared/utils/format-datetime';
import {
  LAYANAN_REJECT_REASON_OPTIONS,
  type LayananContributionWire,
  type LayananPhoneWire,
  type LayananRejectReasonCode,
  type LayananWire,
} from '../infrastructure/layanan-api';
import { useLayananCategoryMap } from '../application/use-layanan-categories';

function textOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
}

function formatPhones(phones: LayananPhoneWire[] | undefined): string {
  if (!phones?.length) return '-';
  return phones
    .map((p) => {
      const parts = [p.phone];
      if (p.note) parts.push(`(${p.note})`);
      if (p.whatsapp) parts.push(`WA: ${p.whatsapp}`);
      return parts.join(' ');
    })
    .join(', ');
}

function renderWithPrev(proposed: string, prev?: string) {
  if (prev === undefined || prev === proposed) return proposed;
  return (
    <Space direction="vertical" size={2}>
      <Typography.Text>{proposed}</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Sebelumnya: {prev}
      </Typography.Text>
    </Space>
  );
}

export function LayananProposalDrawer({
  proposal,
  existingLayanan,
  regionName,
  onClose,
  onApprove,
  onRevise,
  onReject,
}: {
  proposal: LayananContributionWire | null;
  existingLayanan?: LayananWire | null;
  regionName: (id: string | null | undefined) => string;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onRevise: (id: string, note: string) => Promise<void>;
  onReject: (
    id: string,
    reason: { reason_code: LayananRejectReasonCode; reason_text?: string },
  ) => Promise<void>;
}) {
  const { message } = AntdApp.useApp();
  const [busy, setBusy] = useState<'approve' | 'revise' | 'reject' | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<LayananRejectReasonCode>('invalid_phone');
  const [reasonText, setReasonText] = useState('');
  const [revisionOpen, setRevisionOpen] = useState(false);
  const { map: categoryMap } = useLayananCategoryMap();
  const [revisionNote, setRevisionNote] = useState('');

  const payload = proposal?.payload;
  const isEdit = proposal?.kind === 'edit';

  const run = async (action: 'approve' | 'revise' | 'reject', fn: () => Promise<void>) => {
    if (!proposal || busy) return;
    setBusy(action);
    try {
      await fn();
      message.success(
        action === 'approve'
          ? 'Usulan layanan disetujui'
          : action === 'revise'
            ? 'Permintaan revisi dikirim'
            : 'Usulan layanan ditolak',
      );
      onClose();
    } catch (err) {
      message.error(normalizeError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const submitReject = () => {
    if (!proposal) return;
    const trimmed = reasonText.trim();
    if (reasonCode === 'other' && trimmed.length < 3) {
      message.warning('Tulis alasan spesifik (min 3 karakter).');
      return;
    }
    setRejectOpen(false);
    void run('reject', () =>
      onReject(proposal.id, {
        reason_code: reasonCode,
        ...(trimmed ? { reason_text: trimmed } : {}),
      }),
    );
  };

  const submitRevision = () => {
    if (!proposal) return;
    const trimmed = revisionNote.trim();
    if (trimmed.length < 3) {
      message.warning('Tulis catatan revisi (min 3 karakter).');
      return;
    }
    setRevisionOpen(false);
    void run('revise', () => onRevise(proposal.id, trimmed));
  };

  const mapsUrl = payload?.maps_url?.trim() || null;
  const logoUrl = payload?.logo_url?.trim() || null;

  return (
    <Drawer
      title="Pratinjau usulan layanan"
      open={proposal != null}
      onClose={onClose}
      size="large"
      destroyOnHidden
      extra={
        <Space>
          <Button
            loading={busy === 'revise'}
            disabled={busy != null}
            onClick={() => {
              setRevisionNote('');
              setRevisionOpen(true);
            }}
          >
            Minta revisi
          </Button>
          <Button
            danger
            loading={busy === 'reject'}
            disabled={busy != null}
            onClick={() => {
              setReasonText('');
              setRejectOpen(true);
            }}
          >
            Tolak
          </Button>
          <Button
            type="primary"
            loading={busy === 'approve'}
            disabled={busy != null}
            onClick={() => proposal && void run('approve', () => onApprove(proposal.id))}
          >
            Setujui
          </Button>
        </Space>
      }
    >
      {proposal && payload ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={isEdit ? 'blue' : 'green'}>
              {isEdit ? 'Usulan sunting' : 'Layanan baru'}
            </Tag>
            <Tag>{categoryMap[payload.category]?.name ?? payload.category}</Tag>
            {existingLayanan ? <Tag>Target: {existingLayanan.name}</Tag> : null}
          </Space>

          <Typography.Title level={4} style={{ margin: 0 }}>
            {textOrDash(payload.name) !== '-'
              ? textOrDash(payload.name)
              : existingLayanan?.name ?? 'Usulan layanan'}
          </Typography.Title>

          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Pengusul">{textOrDash(proposal.username)}</Descriptions.Item>
            {existingLayanan ? (
              <Descriptions.Item label="Layanan yang dituju">
                {existingLayanan.name} ({existingLayanan.slug})
              </Descriptions.Item>
            ) : null}
            {proposal.created_at ? (
              <Descriptions.Item label="Dikirim">{formatDateTime(proposal.created_at)}</Descriptions.Item>
            ) : null}
            {proposal.revision_note ? (
              <Descriptions.Item label="Catatan revisi sebelumnya">
                {proposal.revision_note}
              </Descriptions.Item>
            ) : null}
          </Descriptions>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Detail layanan diajukan
          </Typography.Title>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Kategori">
              {renderWithPrev(
                categoryMap[payload.category]?.name ?? payload.category,
                isEdit && existingLayanan
                  ? categoryMap[existingLayanan.category]?.name ?? existingLayanan.category
                  : undefined,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nama">
              {renderWithPrev(
                textOrDash(payload.name),
                isEdit && existingLayanan ? textOrDash(existingLayanan.name) : undefined,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nomor telepon">
              {payload.phones?.length ? (
                <Space direction="vertical" size={2}>
                  {payload.phones.map((p, idx) => (
                    <Typography.Text key={idx}>
                      {p.phone}
                      {p.note ? ` (${p.note})` : ''}
                      {p.whatsapp ? ` - WA: ${p.whatsapp}` : ''}
                    </Typography.Text>
                  ))}
                  {isEdit && existingLayanan && formatPhones(existingLayanan.phones) !== formatPhones(payload.phones) ? (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Sebelumnya: {formatPhones(existingLayanan.phones)}
                    </Typography.Text>
                  ) : null}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Kecamatan">
              {renderWithPrev(
                regionName(payload.region_id),
                isEdit && existingLayanan ? regionName(existingLayanan.region_id) : undefined,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Desa">
              {regionName(payload.village_id)}
            </Descriptions.Item>
            <Descriptions.Item label="Alamat">
              {renderWithPrev(
                textOrDash(payload.address_text),
                isEdit && existingLayanan ? textOrDash(existingLayanan.address_text) : undefined,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Koordinat">
              {payload.lat != null && payload.lng != null ? (
                <Typography.Link
                  href={withSambaskuUtm(
                    `https://www.google.com/maps/search/?api=1&query=${payload.lat},${payload.lng}`,
                  )}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {payload.lat}, {payload.lng}
                </Typography.Link>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Link peta">
              {mapsUrl ? (
                <Typography.Link
                  href={withSambaskuUtm(mapsUrl)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {mapsUrl}
                </Typography.Link>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Catatan">
              {renderWithPrev(
                textOrDash(payload.note),
                isEdit && existingLayanan ? textOrDash(existingLayanan.note) : undefined,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Logo">
              {logoUrl ? (
                <Image src={logoUrl} width={120} style={{ borderRadius: 8 }} />
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>
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
          <Radio.Group
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as LayananRejectReasonCode)}
          >
            <Space direction="vertical">
              {LAYANAN_REJECT_REASON_OPTIONS.map((r) => (
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
        title="Minta revisi ke pengusul"
        open={revisionOpen}
        onCancel={() => setRevisionOpen(false)}
        onOk={submitRevision}
        okText="Kirim permintaan revisi"
        okButtonProps={{ loading: busy === 'revise' }}
        cancelText="Batal"
        destroyOnHidden
      >
        <Input.TextArea
          value={revisionNote}
          onChange={(e) => setRevisionNote(e.target.value)}
          placeholder="Tulis bagian yang perlu dilengkapi atau diperbaiki (min 3 karakter)"
          maxLength={500}
          showCount
          rows={4}
        />
      </Modal>
    </Drawer>
  );
}
