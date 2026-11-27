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
  KARYA_REJECT_REASON_OPTIONS,
  type AccessLinkWire,
  type KaryaCreditWire,
  type KaryaContributionWire,
  type KaryaRelatedRefWire,
  type KaryaRejectReasonCode,
  type KaryaWire,
  type SambasConnectionWire,
} from '../infrastructure/karya-api';

const CONTRIBUTION_KIND_META: Record<
  KaryaContributionWire['kind'],
  { label: string; color: string }
> = {
  new: { label: 'Karya baru', color: 'green' },
  edit: { label: 'Usulan sunting', color: 'blue' },
  excerpt: { label: 'Usulan kutipan', color: 'purple' },
};

const SAMBAS_TYPE_LABEL: Record<string, string> = {
  creator_origin: 'Kreator dari Sambas',
  language: 'Bahasa Sambas',
  location: 'Lokasi Sambas',
  theme: 'Tema Sambas',
  other: 'Lainnya',
};

const RELATED_KIND_LABEL: Record<string, string> = {
  place: 'Tempat',
  event: 'Acara',
  article: 'Artikel',
  usaha: 'Usaha',
  kreator: 'Kreator',
  karya: 'Karya',
  word: 'Kata',
};

function textOrDash(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : '-';
  }
  return '-';
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

export function KaryaProposalDrawer({
  proposal,
  existingKarya,
  onClose,
  onApprove,
  onRevise,
  onReject,
}: {
  proposal: KaryaContributionWire | null;
  existingKarya?: KaryaWire | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onRevise: (id: string, note: string) => Promise<void>;
  onReject: (
    id: string,
    reason: { reason_code: KaryaRejectReasonCode; reason_text?: string },
  ) => Promise<void>;
}) {
  const { message } = AntdApp.useApp();
  const [busy, setBusy] = useState<'approve' | 'revise' | 'reject' | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<KaryaRejectReasonCode>('invalid_metadata');
  const [reasonText, setReasonText] = useState('');
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  const payload = proposal?.payload ?? {};
  const isExcerpt = proposal?.kind === 'excerpt';
  const isEdit = proposal?.kind === 'edit';

  const run = async (action: 'approve' | 'revise' | 'reject', fn: () => Promise<void>) => {
    if (!proposal || busy) return;
    setBusy(action);
    try {
      await fn();
      message.success(
        action === 'approve'
          ? 'Usulan karya disetujui'
          : action === 'revise'
            ? 'Permintaan revisi dikirim'
            : 'Usulan karya ditolak',
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

  const credits = Array.isArray(payload.credits) ? (payload.credits as KaryaCreditWire[]) : [];
  const sambasConnections = Array.isArray(payload.sambas_connections)
    ? (payload.sambas_connections as SambasConnectionWire[])
    : [];
  const accessLinks = Array.isArray(payload.access_links)
    ? (payload.access_links as AccessLinkWire[])
    : [];
  const related = Array.isArray(payload.related) ? (payload.related as KaryaRelatedRefWire[]) : [];
  const coverUrl = typeof payload.cover_url === 'string' && payload.cover_url.trim()
    ? payload.cover_url.trim()
    : null;
  const sourceUrl = typeof payload.source_url === 'string' && payload.source_url.trim()
    ? payload.source_url.trim()
    : null;

  const heading = isExcerpt
    ? existingKarya?.title ?? 'Usulan kutipan'
    : textOrDash(payload.title) !== '-'
      ? textOrDash(payload.title)
      : existingKarya?.title ?? 'Usulan karya';

  const mediaKindLabel = (v: unknown) => (v === 'film' ? 'Film' : v === 'music' ? 'Musik' : textOrDash(v));

  return (
    <Drawer
      title="Pratinjau usulan karya"
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
      {proposal ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={CONTRIBUTION_KIND_META[proposal.kind].color}>
              {CONTRIBUTION_KIND_META[proposal.kind].label}
            </Tag>
            {!isExcerpt && typeof payload.kind === 'string' ? (
              <Tag>{mediaKindLabel(payload.kind)}</Tag>
            ) : null}
            {existingKarya ? <Tag>Target: {existingKarya.title}</Tag> : null}
          </Space>

          <Typography.Title level={4} style={{ margin: 0 }}>
            {heading}
          </Typography.Title>

          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Pengusul">{textOrDash(proposal.username)}</Descriptions.Item>
            {existingKarya ? (
              <Descriptions.Item label="Karya yang dituju">
                {existingKarya.title} ({existingKarya.slug})
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

          {isExcerpt ? (
            <>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Isi kutipan diajukan
              </Typography.Title>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Jenis kutipan">{textOrDash(payload.kind)}</Descriptions.Item>
                <Descriptions.Item label="Bahasa">{textOrDash(payload.language)}</Descriptions.Item>
                <Descriptions.Item label="Teks">
                  <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {textOrDash(payload.text)}
                  </Typography.Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="Penanda mulai">{textOrDash(payload.start_label)}</Descriptions.Item>
                <Descriptions.Item label="Penanda selesai">{textOrDash(payload.end_label)}</Descriptions.Item>
                <Descriptions.Item label="Status hak">{textOrDash(payload.rights_status)}</Descriptions.Item>
                <Descriptions.Item label="Catatan hak">{textOrDash(payload.rights_note)}</Descriptions.Item>
                <Descriptions.Item label="Sumber">
                  {sourceUrl ? (
                    <Typography.Link
                      href={withSambaskuUtm(sourceUrl)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {sourceUrl}
                    </Typography.Link>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </>
          ) : (
            <>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Detail karya diajukan
              </Typography.Title>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Judul">
                  {renderWithPrev(
                    textOrDash(payload.title),
                    isEdit && existingKarya ? textOrDash(existingKarya.title) : undefined,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Jenis">
                  {renderWithPrev(
                    mediaKindLabel(payload.kind),
                    isEdit && existingKarya ? mediaKindLabel(existingKarya.kind) : undefined,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Tahun">
                  {renderWithPrev(
                    textOrDash(payload.year),
                    isEdit && existingKarya ? textOrDash(existingKarya.year) : undefined,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Bahasa">
                  {renderWithPrev(
                    textOrDash(payload.language),
                    isEdit && existingKarya ? textOrDash(existingKarya.language) : undefined,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Deskripsi">
                  {renderWithPrev(
                    textOrDash(payload.description),
                    isEdit && existingKarya ? textOrDash(existingKarya.description) : undefined,
                  )}
                </Descriptions.Item>
                {payload.kind === 'music' ? (
                  <>
                    <Descriptions.Item label="Tipe rilis musik">
                      {renderWithPrev(
                        textOrDash(payload.music_release_type),
                        isEdit && existingKarya
                          ? textOrDash(existingKarya.music_release_type)
                          : undefined,
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Lagu cover">
                      {renderWithPrev(
                        textOrDash(payload.music_is_cover),
                        isEdit && existingKarya ? textOrDash(existingKarya.music_is_cover) : undefined,
                      )}
                    </Descriptions.Item>
                  </>
                ) : null}
                {payload.kind === 'film' ? (
                  <>
                    <Descriptions.Item label="Tipe film">
                      {renderWithPrev(
                        textOrDash(payload.film_type),
                        isEdit && existingKarya ? textOrDash(existingKarya.film_type) : undefined,
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Durasi (menit)">
                      {renderWithPrev(
                        textOrDash(payload.film_runtime_min),
                        isEdit && existingKarya
                          ? textOrDash(existingKarya.film_runtime_min)
                          : undefined,
                      )}
                    </Descriptions.Item>
                  </>
                ) : null}
                <Descriptions.Item label="Cover">
                  {coverUrl ? (
                    <Image src={coverUrl} width={160} style={{ borderRadius: 8 }} />
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Credit">
                  {credits.length > 0 ? (
                    <Space direction="vertical" size={2}>
                      {credits.map((c, idx) => (
                        <Typography.Text key={idx}>
                          {c.name_text} ({c.role})
                        </Typography.Text>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Kaitan Sambas">
                  {sambasConnections.length > 0 ? (
                    <Space direction="vertical" size={2}>
                      {sambasConnections.map((s, idx) => (
                        <Typography.Text key={idx}>
                          {SAMBAS_TYPE_LABEL[s.type] ?? s.type}: {s.note}
                        </Typography.Text>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Link akses">
                  {accessLinks.length > 0 ? (
                    <Space direction="vertical" size={2}>
                      {accessLinks.map((a, idx) => (
                        <Typography.Link
                          key={idx}
                          href={withSambaskuUtm(a.url)}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          [{a.kind}] {a.label} - {a.url}
                        </Typography.Link>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Terkait">
                  {related.length > 0 ? (
                    <Space wrap>
                      {related.map((r, idx) => (
                        <Tag key={idx}>
                          {RELATED_KIND_LABEL[r.kind] ?? r.kind}: {r.slug ?? r.id ?? '-'}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </>
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
            onChange={(e) => setReasonCode(e.target.value as KaryaRejectReasonCode)}
          >
            <Space direction="vertical">
              {KARYA_REJECT_REASON_OPTIONS.map((r) => (
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
