import { useCallback, useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined, EditOutlined, RedoOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Tag,
  Typography,
  Spin,
} from 'antd';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';
import { normalizeError } from '@/shared/api/error';
import { ImageCensorEditor } from '@/features/discussions/presentation/image-censor-editor';
import {
  CONTRIBUTION_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  type WordImageView,
} from '../domain/contribution';
import {
  DEFAULT_REJECT_REASON_PRESET,
  REJECT_REASON_PRESETS,
  resolveRejectComment,
  type RejectReasonPresetId,
} from '../domain/reject-reason-presets';
import { nextPendingId } from '../application/next-pending-id';
import type { ReviewCommitInput } from '../application/review-submit-queue';
import { useContributionDetail } from '../application/use-contribution-detail';
import { useReopenContribution } from '../application/use-reopen-contribution';
import { ContributionEntityView } from './contribution-entity-view';
import { CorrectContributionDrawer } from './correct-contribution-drawer';
import { useSetCanContribute } from '@/features/users/application/use-update-user-role';
import { useUnverifyWord } from '@/features/words/application/use-word-verify';

const { Text } = Typography;

const STATUS_TAG_COLOR: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  corrected: 'blue',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('.ant-drawer, .ant-modal')) return true;
  return false;
}

export interface ContributionReviewPanelProps {
  id: string;
  /** Urutan ID antrean saat ini (sebelum drop) untuk hitung advance. */
  queueIds: string[];
  /** Dipanggil setelah usulan ditutup; `nextId` null = antrean habis. */
  onDecided: (nextId: string | null) => void;
  /** Setujui/tolak: parent drop + advance segera, request di belakang. */
  onCommit: (input: ReviewCommitInput) => void;
}

/**
 * Panel tinjau kanan (master-detail): metadata + entity + aksi sticky.
 * Approve inline (catatan opsional); tolak lewat modal; koreksi drawer.
 */
export function ContributionReviewPanel({ id, queueIds, onDecided, onCommit }: ContributionReviewPanelProps) {
  const detailQuery = useContributionDetail(id);
  const reopenMutation = useReopenContribution();
  const unverifyWord = useUnverifyWord();
  const pauseContribution = useSetCanContribute();
  const { message } = AntdApp.useApp();

  const [approveComment, setApproveComment] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectPresetId, setRejectPresetId] = useState<RejectReasonPresetId>(
    DEFAULT_REJECT_REASON_PRESET,
  );
  const [rejectOtherComment, setRejectOtherComment] = useState('');
  const [correctOpen, setCorrectOpen] = useState(false);
  const [imageDecisions, setImageDecisions] = useState<Record<string, 'approve' | 'reject'>>({});
  const [censoredByImageId, setCensoredByImageId] = useState<Record<string, Blob>>({});
  const [censorTarget, setCensorTarget] = useState<WordImageView | null>(null);

  const detail = detailQuery.data;
  const isPending = detail?.contribution.status === 'pending';
  const canUnverifyWord = Boolean(
    detail?.entityType === 'word' && detail.word.isVerified && !isPending,
  );
  const moderateImages = Boolean(isPending && detail?.entityType === 'word' && detail.word.images.length > 0);
  const allowCensor = Boolean(
    isPending &&
      (detail?.entityType === 'word' ||
        (detail?.entityType === 'word_image' &&
          (detail.child.fields as { provider?: string | null }).provider === 'imagekit')),
  );

  const finishDecision = useCallback(() => {
    onDecided(nextPendingId(queueIds, id));
  }, [id, onDecided, queueIds]);

  const reopen = useCallback(async () => {
    if (!detail || isPending || reopenMutation.isPending) return;
    try {
      await reopenMutation.mutateAsync(detail.contribution.id);
      message.success('Keputusan dibuka ulang - tinjau ulang sekarang');
      await detailQuery.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  }, [detail, detailQuery, isPending, message, reopenMutation]);

  const unverify = useCallback(async () => {
    if (!detail || detail.entityType !== 'word' || unverifyWord.isPending) return;
    try {
      await unverifyWord.mutateAsync(detail.word.id);
      message.success('Verifikasi kata dicabut');
      await detailQuery.refetch();
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  }, [detail, detailQuery, message, unverifyWord]);

  const approve = useCallback(() => {
    if (!detail || !isPending) return;
    onCommit({
      id: detail.contribution.id,
      decision: 'approve',
      comment: approveComment.trim() || undefined,
      imageDecisions:
        detail.entityType === 'word' && detail.word.images.length > 0
          ? detail.word.images.map((img) => ({
              image_id: img.id,
              decision: imageDecisions[img.id] ?? 'approve',
            }))
          : undefined,
      censoredByImageId: Object.keys(censoredByImageId).length > 0 ? censoredByImageId : undefined,
      listItem: detail.contribution,
    });
  }, [approveComment, censoredByImageId, detail, imageDecisions, isPending, onCommit]);

  const resetRejectForm = () => {
    setRejectPresetId(DEFAULT_REJECT_REASON_PRESET);
    setRejectOtherComment('');
  };

  const resolvedRejectComment = resolveRejectComment(rejectPresetId, rejectOtherComment);

  const submitReject = () => {
    if (!detail || !resolvedRejectComment) return;
    const comment = resolvedRejectComment;
    setRejectOpen(false);
    resetRejectForm();
    onCommit({
      id: detail.contribution.id,
      decision: 'reject',
      comment,
      listItem: detail.contribution,
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === 'a' || event.key === 'A') {
        if (!isPending || correctOpen || rejectOpen) return;
        event.preventDefault();
        void approve();
      }
      if (event.key === 'r' || event.key === 'R') {
        if (!isPending || correctOpen || rejectOpen) return;
        event.preventDefault();
        setRejectOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [approve, correctOpen, isPending, rejectOpen]);

  if (detailQuery.isPending) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 240 }}>
        <Spin tip="Memuat detail…" />
      </Flex>
    );
  }

  if (detailQuery.isError || !detail) {
    return (
      <Alert
        type="error"
        showIcon
        message="Tidak dapat membuka kontribusi ini"
        description={detailQuery.error?.message ?? 'Kontribusi tidak ditemukan atau akses ditolak.'}
      />
    );
  }

  const entityLabel = ENTITY_TYPE_LABELS[detail.contribution.entity_type] ?? detail.contribution.entity_type;
  const titlePrefix = detail.entityType === 'word' ? detail.word.lemma : detail.child.wordLemma ?? 'entri';
  const searchMiss = detail.contribution.search_miss_id
    ? `${detail.contribution.search_miss_term ?? detail.contribution.search_miss_id}${
        detail.contribution.search_miss_direction
          ? ` (${detail.contribution.search_miss_direction === 'translation' ? 'Indonesia → Sambas' : 'Sambas → Indonesia'})`
          : ''
      }`
    : null;

  return (
    <Flex vertical style={{ height: '100%', minHeight: 0 }}>
      <Flex justify="space-between" align="flex-start" gap={8} style={{ flex: 'none', marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <Text strong style={{ fontSize: 22, lineHeight: 1.2, display: 'block', wordBreak: 'break-word' }}>
            {titlePrefix}
          </Text>
          <Flex wrap gap={6} align="center" style={{ marginTop: 4 }}>
            <Tag style={{ marginInlineEnd: 0 }}>{entityLabel}</Tag>
            <Tag color={STATUS_TAG_COLOR[detail.contribution.status]} style={{ marginInlineEnd: 0 }}>
              {CONTRIBUTION_STATUS_LABELS[detail.contribution.status]}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              oleh{' '}
              {personLabel(
                detail.contribution.contributor_display_name,
                detail.contribution.contributor_username,
              )}{' '}
              · {detail.contribution.action} · {formatDateTime(detail.contribution.created_at)}
            </Text>
            {searchMiss ? <Tag color="purple">{searchMiss}</Tag> : null}
          </Flex>
          {isPending && detail.entityType === 'word' ? (
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
              Jika ejaan sama sudah tayang, Setujui menggabungkan makna ke entri itu.
            </Text>
          ) : null}
        </div>
        {detail.contribution.contributor_username !== 'anonim' ? (
          <Button
            danger
            size="small"
            loading={pauseContribution.isPending}
            onClick={() =>
              pauseContribution.mutate({
                id: detail.contribution.user_id,
                canContribute: false,
                username: detail.contribution.contributor_username,
              })
            }
          >
            Hentikan kontribusi
          </Button>
        ) : null}
      </Flex>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ContributionEntityView
          detail={detail}
          imageDecisions={moderateImages ? imageDecisions : undefined}
          onImageDecision={
            moderateImages
              ? (imageId, decision) => {
                  setImageDecisions((prev) => ({ ...prev, [imageId]: decision }));
                  if (decision === 'reject') {
                    setCensoredByImageId((prev) => {
                      if (!prev[imageId]) return prev;
                      const next = { ...prev };
                      delete next[imageId];
                      return next;
                    });
                  }
                }
              : undefined
          }
          censoredByImageId={allowCensor ? censoredByImageId : undefined}
          onRequestCensor={allowCensor ? (img) => setCensorTarget(img) : undefined}
          onClearCensor={
            allowCensor
              ? (imageId) =>
                  setCensoredByImageId((prev) => {
                    if (!prev[imageId]) return prev;
                    const next = { ...prev };
                    delete next[imageId];
                    return next;
                  })
              : undefined
          }
        />
      </div>

      {detail.review || detail.priorReviews.length > 0 ? (
        <div style={{ flex: 'none', maxHeight: 72, overflow: 'auto', marginTop: 8 }}>
          {detail.review ? (
            <div>
              <Tag color={STATUS_TAG_COLOR[detail.review.status] ?? 'default'}>
                {CONTRIBUTION_STATUS_LABELS[detail.review.status] ?? detail.review.status}
              </Tag>
              <Text style={{ fontSize: 12 }}>{detail.review.comment || 'Tanpa catatan.'}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {' '}
                · {formatDateTime(detail.review.created_at)}
              </Text>
            </div>
          ) : null}
          {detail.priorReviews.map((row, index) => (
            <div key={`${row.created_at}-${index}`}>
              <Tag color={STATUS_TAG_COLOR[row.status] ?? 'default'}>
                {CONTRIBUTION_STATUS_LABELS[row.status] ?? row.status}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDateTime(row.created_at)}
                {row.comment ? ` · ${row.comment}` : ''}
              </Text>
            </div>
          ))}
        </div>
      ) : null}

      {!isPending ? (
        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            paddingTop: 12,
            marginTop: 8,
            background: 'var(--ant-color-bg-container, #fff)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            Buka ulang menahan item dari antrean global sampai ada keputusan baru. Cabut
            verifikasi hanya menghapus stempel kata, tanpa mengubah keputusan kontribusi.
          </Text>
          <Flex justify="flex-end" wrap gap={8}>
            {canUnverifyWord ? (
              <Button
                icon={<SafetyCertificateOutlined />}
                loading={unverifyWord.isPending}
                onClick={() => void unverify()}
              >
                Cabut verifikasi
              </Button>
            ) : null}
            <Button
              type="primary"
              icon={<RedoOutlined />}
              loading={reopenMutation.isPending}
              onClick={() => void reopen()}
            >
              Buka ulang
            </Button>
          </Flex>
        </div>
      ) : null}

      {isPending ? (
        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            paddingTop: 12,
            marginTop: 8,
            background: 'var(--ant-color-bg-container, #fff)',
          }}
        >
          <Input
            placeholder="Catatan opsional untuk kontributor"
            value={approveComment}
            maxLength={2000}
            onChange={(e) => setApproveComment(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Flex justify="space-between" align="center" wrap gap={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              A setujui · R tolak · J/K pindah
            </Text>
            <Flex wrap gap={8}>
            <Button danger icon={<CloseOutlined />} onClick={() => setRejectOpen(true)}>
              Tolak
            </Button>
            <Button icon={<EditOutlined />} onClick={() => setCorrectOpen(true)}>
              Koreksi
            </Button>
            <Button type="primary" icon={<CheckOutlined />} onClick={approve}>
              Setujui
            </Button>
            </Flex>
          </Flex>
        </div>
      ) : null}

      <Modal
        title="Tolak Kontribusi"
        open={rejectOpen}
        onCancel={() => {
          setRejectOpen(false);
          resetRejectForm();
        }}
        okText="Tolak"
        okButtonProps={{
          danger: true,
          disabled: !resolvedRejectComment,
        }}
        onOk={submitReject}
      >
        <Form layout="vertical">
          <Form.Item label="Alasan penolakan" required style={{ marginBottom: 12 }}>
            <Radio.Group
              value={rejectPresetId}
              onChange={(e) => setRejectPresetId(e.target.value as RejectReasonPresetId)}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {REJECT_REASON_PRESETS.map((preset) => (
                <Radio key={preset.id} value={preset.id}>
                  {preset.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          {rejectPresetId === 'other' ? (
            <Form.Item
              label="Jelaskan alasan"
              required
              validateStatus={!rejectOtherComment.trim() ? 'error' : undefined}
              help={
                !rejectOtherComment.trim() ? 'Alasan penolakan wajib diisi.' : undefined
              }
            >
              <Input.TextArea
                rows={3}
                placeholder="Alasan penolakan (wajib)"
                value={rejectOtherComment}
                maxLength={2000}
                onChange={(e) => setRejectOtherComment(e.target.value)}
                autoFocus
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title="Sensor foto"
        open={!!censorTarget}
        onCancel={() => setCensorTarget(null)}
        footer={null}
        width={720}
        destroyOnHidden
        zIndex={1200}
      >
        {censorTarget ? (
          <ImageCensorEditor
            imageUrl={censorTarget.url}
            confirmLabel="Simpan sensor"
            onCancel={() => setCensorTarget(null)}
            onApply={(blob) => {
              setCensoredByImageId((prev) => ({ ...prev, [censorTarget.id]: blob }));
              setCensorTarget(null);
              message.success('Sensor disimpan. Dikirim saat kamu menekan Setujui.');
            }}
          />
        ) : null}
      </Modal>

      <CorrectContributionDrawer
        detail={detail}
        open={correctOpen}
        zIndex={1100}
        onCancel={() => setCorrectOpen(false)}
        onApplied={(result) => {
          if (result.status === 'pending') return;
          finishDecision();
        }}
      />
    </Flex>
  );
}
