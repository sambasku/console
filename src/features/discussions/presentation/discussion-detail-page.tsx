import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  CheckOutlined,
  CloseOutlined,
  PushpinOutlined,
  ReloadOutlined,
  RollbackOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Badge,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Flex,
  Image,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';
import { PageHeader } from '@/shared/components/page-header';
import { PageLoading } from '@/shared/components/page-loading';
import { UserInfoLink } from '@/shared/components/user-info-modal';
import { normalizeError } from '@/shared/api/error';
import { useDiscussionDetail } from '../application/use-discussion-detail';
import {
  useApproveDiscussion,
  usePinDiscussionReply,
  useRejectDiscussion,
  useTakedownDiscussion,
  useTakedownDiscussionReply,
} from '../application/use-discussion-mutations';
import {
  DISCUSSION_STATUS_LABELS,
  DISCUSSION_STATUS_TAG_COLOR,
  previewImageUrl,
} from '../domain/discussion';
import { ImageCensorEditor } from './image-censor-editor';

const { Paragraph, Text } = Typography;

/**
 * Detail moderasi ruang diskusi - /discussions/:id.
 * Pending + gambar: editor sensor opsional sebelum Setujui (multipart file_0..).
 */
export function DiscussionDetailPage() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams({ from: '/console-layout/discussions/$id' });

  const detailQuery = useDiscussionDetail(id);
  const approveMutation = useApproveDiscussion();
  const rejectMutation = useRejectDiscussion();
  const takedownMutation = useTakedownDiscussion();
  const pinMutation = usePinDiscussionReply();
  const takedownReplyMutation = useTakedownDiscussionReply();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  /** Blob tersensor per indeks gambar; null = belum diubah. */
  const [censoredBlobs, setCensoredBlobs] = useState<(Blob | null)[]>([]);
  /** Flag kekerasan per indeks. */
  const [violenceFlags, setViolenceFlags] = useState<boolean[]>([]);

  const detail = detailQuery.data;
  const isPending = detail?.status === 'pending_review';
  const isPublished = detail?.status === 'published';
  const hasImages = (detail?.images.length ?? 0) > 0;

  const censoredSlots = useMemo(() => {
    if (!detail) return [];
    if (censoredBlobs.length === detail.images.length) return censoredBlobs;
    return detail.images.map((_, i) => censoredBlobs[i] ?? null);
  }, [detail, censoredBlobs]);

  const violenceSlots = useMemo(() => {
    if (!detail) return [];
    if (violenceFlags.length === detail.images.length) return violenceFlags;
    return detail.images.map((_, i) => violenceFlags[i] ?? false);
  }, [detail, violenceFlags]);

  const censoredPreviewUrls = useMemo(() => {
    return censoredSlots.map((blob) => (blob ? URL.createObjectURL(blob) : null));
  }, [censoredSlots]);

  useEffect(() => {
    return () => {
      for (const url of censoredPreviewUrls) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [censoredPreviewUrls]);

  const busy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    takedownMutation.isPending ||
    pinMutation.isPending ||
    takedownReplyMutation.isPending;

  const handleApprove = async () => {
    if (!detail) return;

    const runApprove = async () => {
      const files = hasImages ? censoredSlots : undefined;
      const anyCensored = files?.some((f) => f != null && f.size > 0);
      const contentWarnings = hasImages
        ? violenceSlots.map((v) => (v ? (['kekerasan'] as string[]) : []))
        : undefined;
      await approveMutation.mutateAsync({
        id: detail.id,
        censoredFiles: anyCensored ? files : undefined,
        contentWarnings,
      });
      message.success('Ruang diskusi disetujui dan ditayangkan.');
      setCensoredBlobs([]);
      setViolenceFlags([]);
      setEditingIndex(null);
    };

    if (!hasImages) {
      try {
        await runApprove();
      } catch (err) {
        message.warning(normalizeError(err).message || 'Gagal menyetujui');
      }
      return;
    }

    const n = detail.images.length;
    const m = censoredSlots.filter((f) => f != null && f.size > 0).length;
    const k = violenceSlots.filter(Boolean).length;
    modal.confirm({
      title: 'Pastikan semua foto aman',
      content: (
        <Space direction="vertical" size={8}>
          <Text>
            Kamu menyetujui {n} foto ({m} tersensor · {k} ber-flag kekerasan).
          </Text>
          <Text type="secondary">
            Pastikan fotonya bukan NSFW dan aman tayang untuk publik, data sensitif sudah
            disensor bila perlu, dan flag kekerasan sudah ditempel bila perlu.
          </Text>
        </Space>
      ),
      okText: 'Saya sudah memeriksa, setujui',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await runApprove();
        } catch (err) {
          message.warning(normalizeError(err).message || 'Gagal menyetujui');
          throw err;
        }
      },
    });
  };

  const submitReject = async () => {
    if (!detail) return;
    const note = rejectNote.trim();
    if (!note) {
      message.warning('Alasan penolakan wajib diisi');
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id: detail.id, note });
      message.success('Diskusi ditolak.');
      setRejectOpen(false);
      setRejectNote('');
    } catch (err) {
      message.warning(normalizeError(err).message || 'Gagal menolak');
    }
  };

  const handleTakedown = () => {
    if (!detail) return;
    modal.confirm({
      title: 'Tarik dari feed?',
      content: 'Entri hilang dari feed publik. Balasan tetap tersimpan untuk audit.',
      okText: 'Tarik',
      okButtonProps: { danger: true },
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await takedownMutation.mutateAsync({ id: detail.id });
          message.success('Diskusi ditarik dari feed.');
        } catch (err) {
          message.warning(normalizeError(err).message || 'Gagal menarik');
          throw err;
        }
      },
    });
  };

  const handlePin = async (replyId: string) => {
    if (!detail) return;
    try {
      await pinMutation.mutateAsync({ discussionId: detail.id, replyId });
      message.success('Balasan dipin sebagai jawaban terbaik.');
    } catch (err) {
      message.warning(normalizeError(err).message || 'Gagal memin balasan');
    }
  };

  const handleTakedownReply = (replyId: string) => {
    modal.confirm({
      title: 'Tarik balasan?',
      content: 'Balasan tidak lagi tampil di thread publik.',
      okText: 'Tarik',
      okButtonProps: { danger: true },
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await takedownReplyMutation.mutateAsync({ replyId });
          message.success('Balasan ditarik.');
        } catch (err) {
          message.warning(normalizeError(err).message || 'Gagal menarik balasan');
          throw err;
        }
      },
    });
  };

  if (detailQuery.isPending) {
    return <PageLoading tip="Memuat detail ruang diskusi…" />;
  }

  if (detailQuery.isError || !detail) {
    return (
      <>
        <PageHeader title="Ruang Diskusi" subtitle="Gagal memuat detail." />
        <Alert
          type="error"
          showIcon
          message="Tidak dapat membuka entri ini"
          description={detailQuery.error?.message ?? 'Entri tidak ditemukan atau akses ditolak.'}
          action={
            <Button onClick={() => navigate({ to: '/discussions' })} style={{ whiteSpace: 'nowrap' }}>
              Kembali
            </Button>
          }
        />
      </>
    );
  }

  const publishedReplies = detail.replies.filter((r) => r.status === 'published');

  return (
    <>
      <PageHeader
        title="Detail Ruang Diskusi"
        subtitle={
          detail.username
            ? `Dari ${personLabel(detail.display_name, detail.username)} · ${formatDateTime(detail.created_at)}`
            : formatDateTime(detail.created_at)
        }
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => detailQuery.refetch()} loading={detailQuery.isFetching}>
              Muat ulang
            </Button>
            <Button icon={<RollbackOutlined />} onClick={() => navigate({ to: '/discussions' })}>
              Kembali
            </Button>
          </Space>
        }
      />

      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          bordered
          items={[
            {
              key: 'status',
              label: 'Status',
              children: (
                <Tag color={DISCUSSION_STATUS_TAG_COLOR[detail.status]}>
                  {DISCUSSION_STATUS_LABELS[detail.status]}
                </Tag>
              ),
            },
            {
              key: 'user',
              label: 'Pengirim',
              children: detail.username ? (
                <UserInfoLink username={detail.username} label={detail.display_name} />
              ) : (
                '-'
              ),
            },
            {
              key: 'submitted',
              label: 'Dikirim',
              children: formatDateTime(detail.created_at),
            },
            {
              key: 'reviewed',
              label: 'Direview',
              children: detail.reviewed_at ? formatDateTime(detail.reviewed_at) : '-',
            },
            ...(detail.rejection_note
              ? [
                  {
                    key: 'rejection',
                    label: 'Alasan tolak',
                    children: detail.rejection_note,
                    span: 2 as const,
                  },
                ]
              : []),
          ]}
        />

        <Card size="small" title="Isi permintaan">
          {detail.body ? (
            <Paragraph style={{ marginBottom: hasImages || detail.link_url ? 16 : 0, whiteSpace: 'pre-wrap' }}>
              {detail.body}
            </Paragraph>
          ) : (
            <Text type="secondary">Tanpa teks - hanya lampiran gambar.</Text>
          )}

          {detail.link_url ? (
            <Paragraph style={{ marginBottom: hasImages ? 16 : 0 }}>
              <a href={detail.link_url} target="_blank" rel="noopener noreferrer">
                {detail.link_url}
              </a>
            </Paragraph>
          ) : null}

          {hasImages ? (
            <Image.PreviewGroup>
              <Space size={8} wrap style={{ marginTop: detail.body ? 0 : 12 }}>
                {detail.images.map((img, index) => {
                  const local = censoredPreviewUrls[index];
                  return (
                    <div
                      key={img.provider_file_id}
                      style={{
                        position: 'relative',
                        width: 120,
                        height: 120,
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image
                        src={local || previewImageUrl(img)}
                        alt={`Lampiran ${index + 1}`}
                        style={{
                          maxWidth: 120,
                          maxHeight: 120,
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          borderRadius: 8,
                        }}
                      />
                      {local ? (
                        <Tag color="blue" style={{ position: 'absolute', top: 4, left: 4, margin: 0 }}>
                          Tersensor
                        </Tag>
                      ) : null}
                      {violenceSlots[index] ? (
                        <Tag
                          color="orange"
                          style={{
                            position: 'absolute',
                            top: local ? 28 : 4,
                            left: 4,
                            margin: 0,
                          }}
                        >
                          Kekerasan
                        </Tag>
                      ) : null}
                    </div>
                  );
                })}
              </Space>
            </Image.PreviewGroup>
          ) : null}
        </Card>

        {isPending && hasImages ? (
          <>
            <Alert
              type="warning"
              showIcon
              message="Sensor dulu foto yang ada data sensitifnya sebelum menyetujui."
              description="Cat daerah yang perlu disamarkan, lalu tekan Terapkan sensor. Gambar tanpa sensor di-rehost apa adanya."
            />
            <Card size="small" title="Editor sensor">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Flex wrap gap={8}>
                  {detail.images.map((img, index) => (
                    <Button
                      key={img.provider_file_id}
                      type={editingIndex === index ? 'primary' : 'default'}
                      onClick={() => setEditingIndex(index)}
                    >
                      Gambar {index + 1}
                      {censoredSlots[index] ? ' ✓' : ''}
                    </Button>
                  ))}
                </Flex>
                {editingIndex != null && detail.images[editingIndex] ? (
                  <ImageCensorEditor
                    key={`${detail.images[editingIndex].provider_file_id}-${censoredSlots[editingIndex] ? 'c' : 'o'}`}
                    imageUrl={
                      censoredPreviewUrls[editingIndex] ||
                      previewImageUrl(detail.images[editingIndex])
                    }
                    disabled={busy}
                    onApply={(blob) => {
                      setCensoredBlobs((prev) => {
                        const next = detail.images.map((_, i) => prev[i] ?? null);
                        next[editingIndex] = blob;
                        return next;
                      });
                      message.success(`Sensor gambar ${editingIndex + 1} diterapkan.`);
                    }}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <Text type="secondary">Pilih gambar di atas untuk membuka editor.</Text>
                )}
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {detail.images.map((img, index) => (
                    <Checkbox
                      key={`violence-${img.provider_file_id}`}
                      checked={violenceSlots[index]}
                      disabled={busy}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setViolenceFlags((prev) => {
                          const next = detail.images.map((_, i) => prev[i] ?? false);
                          next[index] = checked;
                          return next;
                        });
                      }}
                    >
                      Gambar {index + 1}: foto berisi kekerasan
                    </Checkbox>
                  ))}
                </Space>
              </Space>
            </Card>
          </>
        ) : null}

        {isPending ? (
          <Flex justify="flex-end" wrap gap={8} style={{ paddingTop: 8 }}>
            <Button
              danger
              icon={<CloseOutlined />}
              disabled={busy}
              onClick={() => setRejectOpen(true)}
            >
              Tolak
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={approveMutation.isPending}
              disabled={busy}
              onClick={() => void handleApprove()}
            >
              Setujui
            </Button>
          </Flex>
        ) : null}

        {isPublished ? (
          <Flex justify="flex-end" wrap gap={8}>
            <Button
              danger
              icon={<StopOutlined />}
              loading={takedownMutation.isPending}
              disabled={busy}
              onClick={handleTakedown}
            >
              Tarik
            </Button>
          </Flex>
        ) : null}

        {isPublished || detail.replies.length > 0 ? (
          <Card size="small" title={`Balasan (${detail.replies.length})`}>
            {detail.replies.length === 0 ? (
              <Text type="secondary">Belum ada balasan.</Text>
            ) : (
              <List
                itemLayout="vertical"
                dataSource={detail.replies}
                renderItem={(reply) => {
                  const takenDown = reply.status !== 'published';
                  return (
                    <List.Item
                      key={reply.id}
                      actions={
                        isPublished && reply.status === 'published'
                          ? [
                              <Button
                                key="pin"
                                type="link"
                                size="small"
                                icon={<PushpinOutlined />}
                                disabled={busy || reply.is_pinned}
                                loading={pinMutation.isPending}
                                onClick={() => void handlePin(reply.id)}
                              >
                                {reply.is_pinned ? 'Dipin' : 'Pin'}
                              </Button>,
                              <Button
                                key="takedown"
                                type="link"
                                size="small"
                                danger
                                icon={<StopOutlined />}
                                disabled={busy}
                                onClick={() => handleTakedownReply(reply.id)}
                              >
                                Tarik
                              </Button>,
                            ]
                          : undefined
                      }
                    >
                      <List.Item.Meta
                        title={
                          <Space wrap size={8}>
                            {reply.username ? (
                              <UserInfoLink
                                username={reply.username}
                                label={reply.display_name}
                              />
                            ) : (
                              <Text type="secondary">Anonim</Text>
                            )}
                            {reply.is_verifier ? <Badge status="processing" text="Verifikator" /> : null}
                            {reply.is_pinned ? <Tag color="blue">Dipin</Tag> : null}
                            {takenDown ? (
                              <Tag>{reply.status === 'deleted_by_author' ? 'Dihapus penulis' : 'Ditarik'}</Tag>
                            ) : null}
                          </Space>
                        }
                        description={formatDateTime(reply.created_at)}
                      />
                      <Paragraph
                        style={{
                          marginBottom: 0,
                          whiteSpace: 'pre-wrap',
                          opacity: takenDown ? 0.55 : 1,
                        }}
                      >
                        {reply.body || <Text type="secondary">-</Text>}
                      </Paragraph>
                    </List.Item>
                  );
                }}
              />
            )}
            {isPublished && publishedReplies.length === 0 && detail.replies.length > 0 ? (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Semua balasan sudah ditarik atau dihapus.
              </Text>
            ) : null}
          </Card>
        ) : null}
      </Space>

      <Modal
        title="Tolak ruang diskusi"
        open={rejectOpen}
        onCancel={() => {
          setRejectOpen(false);
          setRejectNote('');
        }}
        onOk={() => void submitReject()}
        confirmLoading={rejectMutation.isPending}
        okText="Tolak"
        okButtonProps={{ danger: true }}
      >
        <Paragraph type="secondary">Alasan penolakan wajib diisi dan dikirim ke pengirim.</Paragraph>
        <Input.TextArea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Alasan penolakan"
          rows={4}
          maxLength={2000}
          showCount
        />
      </Modal>
    </>
  );
}
