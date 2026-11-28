import { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Flex,
  Image,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { normalizeError } from '@/shared/api/error';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { ImageCensorEditor } from '@/features/discussions/presentation/image-censor-editor';
import {
  approveExploreCommentImageRequest,
  censorExploreCommentImageRequest,
  listExploreCommentsRequest,
  rejectExploreCommentImageRequest,
  takedownExploreCommentRequest,
  type AdminExploreCommentItem,
  type ExploreCommentModule,
} from '../infrastructure/comment-api';
import { COMMENT_STATUS_LABELS, COMMENT_STATUS_TAG_COLOR } from '../domain/comment';

const MODULE_OPTIONS: Array<{ value: ExploreCommentModule; label: string }> = [
  { value: 'place', label: 'Wisata' },
  { value: 'culinary', label: 'Kuliner' },
  { value: 'usaha', label: 'Usaha' },
  { value: 'event', label: 'Acara' },
  { value: 'karya', label: 'Karya' },
  { value: 'encyclopedia', label: 'Ensiklopedia' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua status' },
  { value: 'published', label: 'Tayang' },
  { value: 'taken_down', label: 'Di-takedown' },
  { value: 'deleted_by_author', label: 'Dihapus penulis' },
];

const MEDIA_OPTIONS = [
  { value: 'all', label: 'Semua konten' },
  { value: 'image_pending', label: 'Foto menunggu cek' },
  { value: 'any', label: 'Ada foto/audio' },
  { value: 'image', label: 'Ada foto' },
  { value: 'audio', label: 'Ada audio' },
];

export function ExploreCommentsPanel({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const { message, modal } = AntdApp.useApp();

  const [module, setModule] = useState<ExploreCommentModule>('place');
  const [statusFilter, setStatusFilter] = useState<string>('published');
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const debouncedQ = useDebouncedValue(search, 300);

  const [censorTarget, setCensorTarget] = useState<AdminExploreCommentItem | null>(null);

  const queryKey = ['admin', 'explore-comments', module, statusFilter, mediaFilter, debouncedQ];

  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      listExploreCommentsRequest(
        {
          module,
          status:
            statusFilter === 'all'
              ? undefined
              : (statusFilter as 'published' | 'taken_down' | 'deleted_by_author'),
          hasMedia:
            mediaFilter === 'all' || mediaFilter === 'image_pending'
              ? undefined
              : (mediaFilter as 'image' | 'audio' | 'any'),
          imageStatus: mediaFilter === 'image_pending' ? 'pending_review' : undefined,
          q: debouncedQ || undefined,
          cursor: pageParam,
        },
        signal,
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'explore-comments'] });

  const takedownMutation = useMutation({
    mutationFn: ({ mod, id }: { mod: ExploreCommentModule; id: string }) =>
      takedownExploreCommentRequest(mod, id),
    onSuccess: () => {
      message.success('Komentar di-takedown');
      invalidate();
    },
    onError: (err) => message.error(normalizeError(err).message),
  });

  const approveImageMutation = useMutation({
    mutationFn: ({ mod, id }: { mod: ExploreCommentModule; id: string }) =>
      approveExploreCommentImageRequest(mod, id),
    onSuccess: () => {
      message.success('Foto komentar disetujui');
      invalidate();
    },
    onError: (err) => message.error(normalizeError(err).message),
  });

  const rejectImageMutation = useMutation({
    mutationFn: ({
      mod,
      id,
      abusive,
    }: {
      mod: ExploreCommentModule;
      id: string;
      abusive: boolean;
    }) => rejectExploreCommentImageRequest(mod, id, abusive),
    onSuccess: () => {
      message.success('Foto komentar diturunkan');
      invalidate();
    },
    onError: (err) => message.error(normalizeError(err).message),
  });

  const censorImageMutation = useMutation({
    mutationFn: ({
      mod,
      id,
      blob,
    }: {
      mod: ExploreCommentModule;
      id: string;
      blob: Blob;
    }) => censorExploreCommentImageRequest(mod, id, blob),
    onSuccess: () => {
      message.success('Foto tersensor disimpan');
      setCensorTarget(null);
      invalidate();
    },
    onError: (err) => message.error(normalizeError(err).message),
  });

  const confirmTakedown = (item: AdminExploreCommentItem) => {
    modal.confirm({
      title: 'Takedown komentar ini?',
      content: `"${item.body || '(tanpa teks)'}" - ${personLabel(
        item.author_display_name,
        item.author_username,
        'pengguna terhapus',
      )}`,
      okText: 'Takedown',
      okButtonProps: { danger: true },
      onOk: () => takedownMutation.mutateAsync({ mod: item.module, id: item.id }),
    });
  };

  const confirmApproveImage = (item: AdminExploreCommentItem) => {
    modal.confirm({
      title: 'Setujui foto komentar?',
      content: 'Foto akan tayang publik. Teks komentar sudah tayang.',
      okText: 'Setujui',
      onOk: () => approveImageMutation.mutateAsync({ mod: item.module, id: item.id }),
    });
  };

  const confirmRejectImage = (item: AdminExploreCommentItem) => {
    const isPending = item.image?.status === 'pending_review';
    modal.confirm({
      title: isPending ? 'Tolak foto komentar ini?' : 'Turunkan foto komentar ini?',
      content: 'Foto akan dihapus dari tampilan publik. Teks komentar tetap tayang.',
      okText: isPending ? 'Tolak foto' : 'Turunkan foto',
      okButtonProps: { danger: true },
      onOk: () =>
        rejectImageMutation.mutateAsync({ mod: item.module, id: item.id, abusive: false }),
    });
  };

  const columns: ColumnsType<AdminExploreCommentItem> = [
    {
      title: 'Komentar',
      dataIndex: 'body',
      width: 380,
      render: (_, row) => {
        const imgUrl = row.image?.public_url || row.image?.url;
        const canShowImage =
          row.image && (row.image.status === 'published' || row.image.status === 'pending_review');
        return (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {row.body ? (
              <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ margin: 0 }}>
                {row.body}
              </Typography.Paragraph>
            ) : (
              <Typography.Text type="secondary">(media saja)</Typography.Text>
            )}
            {row.audio_url ? (
              <audio controls preload="none" src={row.audio_url} style={{ height: 32, maxWidth: 260 }} />
            ) : null}
            {canShowImage && imgUrl ? (
              <Flex gap={8} align="center">
                <Image
                  src={imgUrl}
                  width={72}
                  height={72}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
                {row.image?.status === 'pending_review' ? (
                  <Tag color="orange">Menunggu cek</Tag>
                ) : null}
              </Flex>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: 'Konten',
      dataIndex: 'target_name',
      width: 200,
      render: (_, row) => (
        <div>
          <Typography.Text strong>{row.target_name}</Typography.Text>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              /{row.target_slug}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Penulis',
      dataIndex: 'author_username',
      width: 170,
      render: (_, row) =>
        personLabel(row.author_display_name, row.author_username, 'pengguna terhapus'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (status: AdminExploreCommentItem['status']) => (
        <Tag color={COMMENT_STATUS_TAG_COLOR[status]}>{COMMENT_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: 'Dibuat',
      dataIndex: 'created_at',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: 'Aksi',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, row) => {
        const isImagePending = row.image?.status === 'pending_review';
        const hasModerableImage =
          Boolean(row.image?.public_url || row.image?.url) &&
          (row.image?.status === 'published' || isImagePending);
        return (
          <Flex gap={0}>
            {isImagePending ? (
              <Tooltip title="Setujui foto">
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  loading={
                    approveImageMutation.isPending && approveImageMutation.variables?.id === row.id
                  }
                  onClick={() => confirmApproveImage(row)}
                />
              </Tooltip>
            ) : null}
            {hasModerableImage ? (
              <>
                <Tooltip title="Sensor foto">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => setCensorTarget(row)}
                  />
                </Tooltip>
                <Tooltip title={isImagePending ? 'Tolak foto' : 'Turunkan foto'}>
                  <Button
                    type="link"
                    danger
                    icon={<CloseOutlined />}
                    loading={
                      rejectImageMutation.isPending && rejectImageMutation.variables?.id === row.id
                    }
                    onClick={() => confirmRejectImage(row)}
                  />
                </Tooltip>
              </>
            ) : null}
            {row.status === 'published' ? (
              <Tooltip title="Takedown komentar">
                <Button
                  type="link"
                  danger
                  icon={<StopOutlined />}
                  loading={takedownMutation.isPending && takedownMutation.variables?.id === row.id}
                  onClick={() => confirmTakedown(row)}
                />
              </Tooltip>
            ) : null}
            {!hasModerableImage && row.status !== 'published' ? (
              <Typography.Text type="secondary">-</Typography.Text>
            ) : null}
          </Flex>
        );
      },
    },
  ];

  const censorImageUrl = censorTarget?.image?.public_url || censorTarget?.image?.url || '';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex wrap="wrap" gap={12} align="center" justify="space-between">
        <Segmented
          value={module}
          onChange={(v) => setModule(v as ExploreCommentModule)}
          options={MODULE_OPTIONS}
        />
        <Flex wrap="wrap" gap={8} align="center">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            style={{ width: 160 }}
          />
          <Select
            value={mediaFilter}
            onChange={setMediaFilter}
            options={MEDIA_OPTIONS}
            style={{ width: 160 }}
          />
          <Input.Search
            placeholder="Cari isi atau nama konten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>
            Muat ulang
          </Button>
        </Flex>
      </Flex>

      {query.isError ? (
        <Alert type="error" message={normalizeError(query.error).message} />
      ) : null}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={query.isLoading || query.isFetching}
        pagination={false}
        scroll={{ x: 1000 }}
      />

      {query.hasNextPage ? (
        <Flex justify="center">
          <Button
            onClick={() => query.fetchNextPage()}
            loading={query.isFetchingNextPage}
          >
            Muat lebih banyak
          </Button>
        </Flex>
      ) : null}

      <Modal
        open={Boolean(censorTarget)}
        title="Sensor foto komentar"
        footer={null}
        width={720}
        destroyOnClose
        onCancel={() => setCensorTarget(null)}
      >
        {censorTarget && censorImageUrl ? (
          <ImageCensorEditor
            imageUrl={censorImageUrl}
            disabled={censorImageMutation.isPending}
            confirmLabel="Simpan foto tersensor"
            onApply={(blob) =>
              censorImageMutation.mutate({
                mod: censorTarget.module,
                id: censorTarget.id,
                blob,
              })
            }
            onCancel={() => setCensorTarget(null)}
          />
        ) : null}
      </Modal>
    </Space>
  );
}
