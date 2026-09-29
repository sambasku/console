import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, App as AntdApp, Button, Col, Empty, Flex, List, Row, Select, Switch, Tabs, Tag, Typography, theme } from 'antd';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { PageHeader } from '@/shared/components/page-header';
import { useContributionList } from '../application/use-contribution-list';
import { adjacentPendingId, nextPendingId } from '../application/next-pending-id';
import { useReviewSubmitQueue, type ReviewCommitInput } from '../application/review-submit-queue';
import { normalizeContributionDetail } from '../application/contribution-mappers';
import {
  CONTRIBUTION_STATUS_LABELS,
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  type ContributionStatus,
  type EntityType,
} from '../domain/contribution';
import { getContributionDetailRequest } from '../infrastructure/contribution-api';
import { useAuth } from '@/shared/auth/use-auth';
import { ContributionReviewPanel } from './contribution-review-panel';

const contributionsRouteApi = getRouteApi('/console-layout/contributions');

/** Tinggi panel tinjau: sisa viewport setelah header konsol, padding, judul, tab, dan filter. */
const REVIEW_PANE_HEIGHT = 'calc(100dvh - 340px)';

/** Tabs antrean review (default: Menunggu). */
type StatusTab = ContributionStatus | 'all';

const STATUS_TABS: { key: StatusTab; label: string; status?: ContributionStatus }[] = [
  { key: 'pending', label: CONTRIBUTION_STATUS_LABELS.pending, status: 'pending' },
  { key: 'approved', label: CONTRIBUTION_STATUS_LABELS.approved, status: 'approved' },
  { key: 'rejected', label: CONTRIBUTION_STATUS_LABELS.rejected, status: 'rejected' },
  { key: 'corrected', label: CONTRIBUTION_STATUS_LABELS.corrected, status: 'corrected' },
  { key: 'all', label: 'Semua' },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('.ant-drawer, .ant-modal')) return true;
  return false;
}

/**
 * Antrean review master-detail: list kiri + panel tinjau kanan.
 * Seleksi lewat search `?id=`; setelah keputusan auto-advance.
 */
export function ContributionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate({ from: '/contributions' });
  const { id: selectedId } = contributionsRouteApi.useSearch();
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<StatusTab>('pending');
  const [entityType, setEntityType] = useState<EntityType | undefined>();
  const [mineOnly, setMineOnly] = useState(false);

  const status = STATUS_TABS.find((t) => t.key === statusTab)?.status;

  const { items, hasMore, loadMore, isLoading, isFetching, isFetchingNextPage, isError, error, refetch } =
    useContributionList({
      status,
      entityType,
      mine: mineOnly,
      enabled: user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'root',
    });

  const selectId = useCallback(
    (id: string | undefined) => {
      void navigate({
        search: (prev) => ({ ...prev, id }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  const handleDecided = useCallback(
    (nextId: string | null) => {
      selectId(nextId ?? undefined);
      if (nextId == null) {
        message.info('Antrean selesai');
      }
    },
    [message, selectId],
  );

  const { enqueue, suppressedIds } = useReviewSubmitQueue(selectId);

  const visibleItems = useMemo(
    () => items.filter((item) => !suppressedIds.has(item.id)),
    [items, suppressedIds],
  );
  const queueIds = useMemo(() => visibleItems.map((item) => item.id), [visibleItems]);

  const commitReview = useCallback(
    (input: ReviewCommitInput) => {
      const nextId = nextPendingId(queueIds, input.id);
      if (!enqueue(input)) return;
      message.success(input.decision === 'approve' ? 'Kontribusi disetujui.' : 'Kontribusi ditolak.');
      handleDecided(nextId);
    },
    [enqueue, handleDecided, message, queueIds],
  );

  // Prefetch detail item berikutnya.
  useEffect(() => {
    if (!selectedId) return;
    const index = queueIds.indexOf(selectedId);
    const nextId = index >= 0 && index + 1 < queueIds.length ? queueIds[index + 1] : null;
    if (!nextId) return;
    void queryClient.prefetchQuery({
      queryKey: ['contributions', 'detail', nextId],
      queryFn: async ({ signal }) => {
        const payload = await getContributionDetailRequest(nextId, signal);
        return normalizeContributionDetail(payload);
      },
      staleTime: 30_000,
    });
  }, [selectedId, queueIds, queryClient]);

  // Keyboard j/k navigasi antrean.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === 'j' || event.key === 'J') {
        event.preventDefault();
        const next = adjacentPendingId(queueIds, selectedId, 1);
        if (next) selectId(next);
      }
      if (event.key === 'k' || event.key === 'K') {
        event.preventDefault();
        const prev = adjacentPendingId(queueIds, selectedId, -1);
        if (prev) selectId(prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [queueIds, selectedId, selectId]);

  return (
    <>
      <PageHeader
        title={mineOnly ? 'Riwayat Verifikasi Saya' : 'Antrean Review'}
        subtitle={
          mineOnly
            ? 'Keputusan yang Anda berikan - buka ulang untuk memperbaiki kesalahan, atau cabut verifikasi kata.'
            : 'Tinjau di tempat yang sama - setujui/tolak/koreksi lalu lanjut otomatis ke usulan berikutnya.'
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Muat ulang
          </Button>
        }
      />
      <Flex wrap gap={16} align="center" style={{ marginBottom: 8 }}>
        <Flex align="center" gap={8}>
          <Switch
            checked={mineOnly}
            onChange={(checked) => {
              setMineOnly(checked);
              if (checked && statusTab === 'pending') setStatusTab('all');
              if (!checked) setStatusTab('pending');
              selectId(undefined);
            }}
          />
          <Typography.Text>Riwayat saya</Typography.Text>
        </Flex>
      </Flex>
      <Tabs
        activeKey={statusTab}
        onChange={(key) => setStatusTab(key as StatusTab)}
        items={STATUS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        style={{ marginBottom: 8 }}
      />
      <Flex wrap gap={12} style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Jenis konten"
          style={{ width: 200 }}
          options={ENTITY_TYPES.map((t) => ({ value: t, label: ENTITY_TYPE_LABELS[t] }))}
          value={entityType}
          onChange={setEntityType}
        />
      </Flex>

      {isError ? (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message="Gagal memuat data" description={error?.message} />
      ) : null}

      <Row gutter={[16, 16]} style={{ minHeight: REVIEW_PANE_HEIGHT }}>
        <Col xs={24} md={9} lg={8} xl={7}>
          <div
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              maxHeight: 'min(40vh, 320px)',
              overflow: 'auto',
              background: token.colorBgContainer,
            }}
            className="contribution-queue-list"
          >
            <List
              loading={isLoading || (isFetching && !items.length)}
              dataSource={visibleItems}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tidak ada usulan" /> }}
              renderItem={(item) => {
                const selected = item.id === selectedId;
                const lemma = item.word_lemma?.trim();
                return (
                  <List.Item
                    key={item.id}
                    onClick={() => selectId(item.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '10px 14px',
                      background: selected ? token.colorPrimaryBg : undefined,
                      borderLeft: selected ? `3px solid ${token.colorPrimary}` : '3px solid transparent',
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <Flex justify="space-between" gap={8} align="center">
                          <Typography.Text strong ellipsis style={{ maxWidth: 180 }}>
                            {lemma || ENTITY_TYPE_LABELS[item.entity_type] || 'Usulan'}
                          </Typography.Text>
                          <Tag style={{ marginInlineEnd: 0 }}>{ENTITY_TYPE_LABELS[item.entity_type] ?? item.entity_type}</Tag>
                        </Flex>
                      }
                      description={
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {personLabel(item.contributor_display_name, item.contributor_username)} ·{' '}
                          {formatDateTime(item.created_at)}
                        </Typography.Text>
                      }
                    />
                  </List.Item>
                );
              }}
            />
            <Flex justify="center" align="center" gap={12} style={{ padding: 12 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {visibleItems.length} dimuat
              </Typography.Text>
              {hasMore ? (
                <Button size="small" onClick={() => loadMore()} loading={isFetchingNextPage}>
                  Muat lagi
                </Button>
              ) : null}
            </Flex>
          </div>
        </Col>

        <Col xs={24} md={15} lg={16} xl={17}>
          <div
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              padding: 16,
              minHeight: 320,
              height: REVIEW_PANE_HEIGHT,
              overflow: 'hidden',
              background: token.colorBgContainer,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedId ? (
              <ContributionReviewPanel
                key={selectedId}
                id={selectedId}
                queueIds={queueIds}
                onDecided={handleDecided}
                onCommit={commitReview}
              />
            ) : (
              <Flex align="center" justify="center" style={{ flex: 1 }}>
                <Empty description={visibleItems.length ? 'Pilih usulan di kiri untuk meninjau' : 'Tidak ada yang menunggu'} />
              </Flex>
            )}
          </div>
        </Col>
      </Row>

      <style>{`
        @media (min-width: 768px) {
          .contribution-queue-list {
            max-height: ${REVIEW_PANE_HEIGHT} !important;
          }
        }
      `}</style>
    </>
  );
}
