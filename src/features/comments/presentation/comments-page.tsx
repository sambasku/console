import { useMemo, useState } from 'react';
import { createColumnHelper, useTable } from '@tanstack/react-table';
import { tableFeatureSet } from '../../../shared/components/table-features';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Alert, App as AntdApp, Button, Flex, Image, Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import { VerifierMark } from '@/shared/components/verifier-mark';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';
import { useNavigate } from '@tanstack/react-router';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/page-header';
import { normalizeError } from '@/shared/api/error';
import { useAuth } from '@/shared/auth/use-auth';
import { useCommentList } from '../application/use-comment-list';
import { useTakedownComment } from '../application/use-takedown-comment';
import { useUncensorComment } from '../application/use-uncensor-comment';
import { useApproveCommentImage } from '../application/use-approve-comment-image';
import { useRejectCommentImage } from '../application/use-reject-comment-image';
import {
  COMMENT_STATUS_LABELS,
  COMMENT_STATUSES,
  COMMENT_STATUS_TAG_COLOR,
  type AdminCommentItem,
  type CommentStatus,
} from '../domain/comment';

const columnHelper = createColumnHelper<typeof tableFeatureSet, AdminCommentItem>();

type TabKey = CommentStatus | 'photo_pending';

export function CommentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { message, modal } = AntdApp.useApp();
  const [tab, setTab] = useState<TabKey>('published');
  const photoPending = tab === 'photo_pending';
  const status = photoPending ? undefined : tab;

  const { items, hasMore, loadMore, isLoading, isFetching, isFetchingNextPage, isError, error, refetch } =
    useCommentList({
      status,
      imageStatus: photoPending ? 'pending_review' : undefined,
      enabled: user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'root',
    });

  const takedownMutation = useTakedownComment();
  const uncensorMutation = useUncensorComment();
  const approveImageMutation = useApproveCommentImage();
  const rejectImageMutation = useRejectCommentImage();

  const confirmTakedown = (item: AdminCommentItem) => {
    modal.confirm({
      title: 'Takedown komentar ini?',
      content: `"${item.body}" - ${personLabel(item.display_name, item.username, 'pengguna terhapus')}`,
      okText: 'Takedown',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await takedownMutation.mutateAsync(item.id);
          message.success('Komentar di-takedown');
        } catch (err) {
          message.error(normalizeError(err).message);
          refetch();
        }
      },
    });
  };

  const confirmUncensor = (item: AdminCommentItem) => {
    modal.confirm({
      title: 'Pulihkan teks asli?',
      content: item.body_original ?? '',
      okText: 'Pulihkan',
      onOk: async () => {
        try {
          await uncensorMutation.mutateAsync(item.id);
          message.success('Teks asli dipulihkan');
        } catch (err) {
          message.error(normalizeError(err).message);
          refetch();
        }
      },
    });
  };

  const confirmApproveImage = (item: AdminCommentItem) => {
    modal.confirm({
      title: 'Setujui foto komentar?',
      content: 'Foto akan tayang publik. Teks komentar sudah tayang.',
      okText: 'Setujui',
      onOk: async () => {
        try {
          await approveImageMutation.mutateAsync(item.id);
          message.success('Foto disetujui');
        } catch (err) {
          message.error(normalizeError(err).message);
          refetch();
        }
      },
    });
  };

  const confirmRejectImage = (item: AdminCommentItem, abusive: boolean) => {
    modal.confirm({
      title: abusive ? 'Tolak foto (melanggar)?' : 'Tolak foto komentar?',
      content: abusive
        ? 'Foto dihapus dan penulis dapat strike. Teks komentar tetap tayang.'
        : 'Foto dihapus. Teks komentar tetap tayang.',
      okText: 'Tolak',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await rejectImageMutation.mutateAsync({ id: item.id, abusive });
          message.success('Foto ditolak');
        } catch (err) {
          message.error(normalizeError(err).message);
          refetch();
        }
      },
    });
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('body', {
          header: 'Komentar',
          size: 360,
          cell: (info) => {
            const row = info.row.original;
            const stagingUrl = row.image?.url || row.image?.public_url;
            return (
              <div>
                <Typography.Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: 'Lihat' }}
                  style={{ marginBottom: 8 }}
                >
                  {info.getValue() || '(tanpa teks)'}
                </Typography.Paragraph>
                {row.is_censored && row.body_original ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Asli: {row.body_original}
                  </Typography.Text>
                ) : null}
                {stagingUrl ? (
                  <Image
                    src={stagingUrl}
                    alt="Foto komentar"
                    width={96}
                    height={96}
                    style={{ objectFit: 'cover', borderRadius: 6, marginTop: 4 }}
                  />
                ) : null}
                {row.image?.status === 'pending_review' ? (
                  <Tag color="orange" style={{ marginTop: 6 }}>
                    Foto menunggu cek
                  </Tag>
                ) : null}
              </div>
            );
          },
        }),
        columnHelper.accessor('username', {
          header: 'Penulis',
          size: 160,
          meta: { responsive: ['md'] },
          cell: (info) => {
            const label = personLabel(info.row.original.display_name, info.getValue());
            return label !== '-' ? (
              <Space size={6}>
                <Typography.Text strong>{label}</Typography.Text>
                <VerifierMark show={info.row.original.is_verifier} />
              </Space>
            ) : (
              <Typography.Text type="secondary" italic>
                Pengguna terhapus
              </Typography.Text>
            );
          },
        }),
        columnHelper.accessor('word_id', {
          header: 'Kata',
          size: 160,
          cell: (info) => {
            const wordId = info.getValue();
            const lemma = info.row.original.word_lemma;
            return (
              <Typography.Link onClick={() => navigate({ to: '/words/$id', params: { id: wordId } })}>
                {lemma ?? wordId}
              </Typography.Link>
            );
          },
        }),
        columnHelper.accessor('status', {
          header: 'Status',
          size: 180,
          cell: (info) => (
            <Flex gap={4} wrap>
              <Tag color={COMMENT_STATUS_TAG_COLOR[info.getValue()]}>
                {COMMENT_STATUS_LABELS[info.getValue()]}
              </Tag>
              {info.row.original.is_censored ? <Tag color="gold">Disensor</Tag> : null}
            </Flex>
          ),
        }),
        columnHelper.accessor('created_at', {
          header: 'Dikirim',
          size: 160,
          meta: { responsive: ['lg'] },
          cell: (info) => formatDateTime(info.getValue()),
        }),
        columnHelper.display({
          id: 'reviewed_at',
          header: 'Dimoderasi',
          size: 160,
          meta: { responsive: ['xl'] },
          cell: ({ row }) =>
            row.original.reviewed_at ? (
              formatDateTime(row.original.reviewed_at)
            ) : (
              <Typography.Text type="secondary">-</Typography.Text>
            ),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'Aksi',
          size: 160,
          meta: { fixed: 'right' },
          cell: ({ row }) => {
            const item = row.original;
            const busyTd = takedownMutation.isPending && takedownMutation.variables === item.id;
            const busyUc = uncensorMutation.isPending && uncensorMutation.variables === item.id;
            const busyAp =
              approveImageMutation.isPending && approveImageMutation.variables === item.id;
            const busyRj =
              rejectImageMutation.isPending && rejectImageMutation.variables?.id === item.id;
            const imagePending = item.image?.status === 'pending_review';
            return (
              <Flex gap={0}>
                {imagePending ? (
                  <>
                    <Tooltip title="Setujui foto">
                      <Button
                        type="link"
                        icon={<CheckOutlined />}
                        loading={busyAp}
                        onClick={() => confirmApproveImage(item)}
                      />
                    </Tooltip>
                    <Tooltip title="Tolak foto">
                      <Button
                        type="link"
                        danger
                        icon={<CloseOutlined />}
                        loading={busyRj}
                        onClick={() => confirmRejectImage(item, false)}
                      />
                    </Tooltip>
                  </>
                ) : null}
                {item.is_censored ? (
                  <Tooltip title="Pulihkan teks asli">
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      loading={busyUc}
                      onClick={() => confirmUncensor(item)}
                    />
                  </Tooltip>
                ) : null}
                {item.status === 'published' && !imagePending ? (
                  <Tooltip title="Takedown">
                    <Button
                      type="link"
                      danger
                      icon={<StopOutlined />}
                      loading={busyTd}
                      onClick={() => confirmTakedown(item)}
                    />
                  </Tooltip>
                ) : null}
                {!item.is_censored && item.status !== 'published' && !imagePending ? (
                  <Typography.Text type="secondary">-</Typography.Text>
                ) : null}
              </Flex>
            );
          },
        }),
      ]),
    [
      navigate,
      takedownMutation.isPending,
      takedownMutation.variables,
      uncensorMutation.isPending,
      uncensorMutation.variables,
      approveImageMutation.isPending,
      approveImageMutation.variables,
      rejectImageMutation.isPending,
      rejectImageMutation.variables,
    ],
  );

  const table = useTable({
    features: tableFeatureSet,
    data: items,
    columns,
    getRowId: (row) => String(row.id),
    manualPagination: true,
  });

  const tabItems = [
    { key: 'photo_pending', label: 'Foto menunggu cek' },
    ...COMMENT_STATUSES.map((s) => ({ key: s, label: COMMENT_STATUS_LABELS[s] })),
  ];

  return (
    <>
      <PageHeader
        title="Moderasi Komentar"
        subtitle="Teks tayang langsung. Foto komentar dicek dulu di tab Foto menunggu cek."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Muat ulang
          </Button>
        }
      />
      <Tabs activeKey={tab} onChange={(key) => setTab(key as TabKey)} items={tabItems} />

      {isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Gagal memuat data"
          description={error?.message}
        />
      ) : null}

      <DataTable
        table={table}
        rowKey={(record) => String(record.id)}
        loading={isLoading || (isFetching && !items.length)}
      />

      <Flex justify="center" align="center" gap={16} style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{items.length} komentar dimuat</Typography.Text>
        {hasMore ? (
          <Button onClick={() => loadMore()} loading={isFetchingNextPage}>
            Muat lagi
          </Button>
        ) : null}
      </Flex>
    </>
  );
}
