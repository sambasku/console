import { useState } from 'react';
import { App as AntdApp, Button, Descriptions, Drawer, Image, Input, Modal, Radio, Space, Tag, Typography } from 'antd';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import type { PlaceProposal } from '../infrastructure/place-api';
import { reviewProposal } from '../infrastructure/place-api';

const TYPE_LABEL: Record<string, string> = {
  sejarah: 'Sejarah',
  alam: 'Alam',
  budaya: 'Budaya',
  pantai: 'Pantai',
  belanja: 'Belanja',
};

const REJECT_REASONS: Array<{ code: string; label: string }> = [
  { code: 'not_suitable', label: 'Tidak layak sebagai tempat wisata' },
  { code: 'duplicate', label: 'Sama dengan tempat yang sudah terdaftar' },
  { code: 'inaccurate', label: 'Data atau lokasi tidak akurat' },
  { code: 'other', label: 'Lainnya' },
];

function textOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
}

export function PlaceProposalDrawer({
  proposal,
  categoryName,
  regionName,
  onClose,
  onReviewed,
}: {
  proposal: PlaceProposal | null;
  categoryName: (id: string) => string;
  regionName: (id: string | null) => string;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const { message } = AntdApp.useApp();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<string>('not_suitable');
  const [reasonText, setReasonText] = useState('');
  const payload = proposal?.payload;

  const review = async (
    action: 'approve' | 'reject',
    reject?: { reason_code: string; reason_text?: string },
  ) => {
    if (!proposal || busy) return;
    setBusy(action);
    try {
      await reviewProposal(proposal.id, action, reject);
      message.success(action === 'approve' ? 'Usulan disetujui' : 'Usulan ditolak');
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
    void review('reject', {
      reason_code: reasonCode,
      ...(trimmed ? { reason_text: trimmed } : {}),
    });
    setRejectOpen(false);
  };

  return (
    <Drawer
      title="Pratinjau usulan"
      open={proposal != null}
      onClose={onClose}
      size="large"
      destroyOnHidden
      extra={
        <Space>
          <Button danger loading={busy === 'reject'} disabled={busy != null} onClick={() => setRejectOpen(true)}>
            Tolak
          </Button>
          <Button type="primary" loading={busy === 'approve'} disabled={busy != null} onClick={() => review('approve')}>
            Setujui
          </Button>
        </Space>
      }
    >
      {proposal && payload ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={proposal.place_id ? 'blue' : 'green'}>
              {proposal.place_id ? 'Suntingan' : 'Tempat baru'}
            </Tag>
            {payload.category ? <Tag>{categoryName(payload.category)}</Tag> : null}
            {payload.type ? <Tag>{TYPE_LABEL[payload.type] ?? payload.type}</Tag> : null}
          </Space>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {payload.name}
          </Typography.Title>
          <Typography.Text type="secondary">{payload.slug}</Typography.Text>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Deskripsi">{textOrDash(payload.short_description)}</Descriptions.Item>
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
            <Descriptions.Item label="Jam buka">{textOrDash(payload.hours)}</Descriptions.Item>
            <Descriptions.Item label="Kontak">{textOrDash(payload.contact)}</Descriptions.Item>
            <Descriptions.Item label="Dikirim">
              {proposal.created_at > 0 ? formatDateTime(proposal.created_at * 1000) : '-'}
            </Descriptions.Item>
          </Descriptions>
          {payload.images.length === 0 ? (
            <Typography.Text type="secondary">Tidak ada foto.</Typography.Text>
          ) : (
            <Image.PreviewGroup>
              <Space wrap>
                {payload.images.map((img) => (
                  <Image
                    key={img.url}
                    src={img.url}
                    alt=""
                    width={96}
                    height={96}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          )}
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
            onChange={(e) => setReasonCode(e.target.value as string)}
          >
            <Space direction="vertical">
              {REJECT_REASONS.map((r) => (
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
    </Drawer>
  );
}
