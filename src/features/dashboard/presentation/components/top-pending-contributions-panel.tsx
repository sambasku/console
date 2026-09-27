import { Button, Skeleton, Tag, Typography } from 'antd';
import {
  ENTITY_TYPE_LABELS,
  type ContributionListItem,
} from '@/features/contributions/domain/contribution';
import { useTopPendingContributions } from '@/features/contributions/application/use-top-pending-contributions';
import { formatDateTime } from '@/shared/utils/format-datetime';

export interface TopPendingContributionsPanelProps {
  enabled?: boolean;
  onNavigateAll: () => void;
  onNavigateItem: (id: string) => void;
}

/**
 * Widget Analitik: 10 usulan pending terbaru untuk aksi cepat ke review.
 */
export function TopPendingContributionsPanel({
  enabled = true,
  onNavigateAll,
  onNavigateItem,
}: TopPendingContributionsPanelProps) {
  const { data, isPending, isError, refetch, isFetching } = useTopPendingContributions(10, enabled);

  if (!enabled) return null;

  return (
    <section className="dashboard__chart dashboard__review" aria-label="Antrean review">
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            Antrean review
          </Typography.Title>
          <Typography.Text type="secondary" className="dashboard__chart-subtitle">
            Menunggu keputusan
          </Typography.Text>
        </div>
        <Button type="link" size="small" onClick={onNavigateAll}>
          Buka antrean
        </Button>
      </div>

      {isError ? (
        <div className="dashboard__review-empty">
          <Typography.Text type="secondary">Gagal memuat antrean.</Typography.Text>{' '}
          <Button type="link" size="small" onClick={() => refetch()} loading={isFetching}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      {isPending && !data ? (
        <div className="dashboard__review-skeleton">
          <Skeleton active paragraph={{ rows: 4 }} title={false} />
        </div>
      ) : null}

      {data && data.length === 0 ? (
        <div className="dashboard__review-empty" role="status">
          <Typography.Text type="secondary">Tidak ada usulan menunggu.</Typography.Text>
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <ul className="dashboard__review-list">
          {data.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="dashboard__review-row"
                onClick={() => onNavigateItem(item.id)}
              >
                <span className="dashboard__review-lemma">{titleFor(item)}</span>
                <Tag className="dashboard__review-tag">{ENTITY_TYPE_LABELS[item.entity_type]}</Tag>
                <span className="dashboard__review-meta">
                  {item.contributor_username}
                  <span aria-hidden> · </span>
                  {formatDateTime(item.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function titleFor(item: ContributionListItem): string {
  const lemma = item.word_lemma?.trim();
  if (lemma) return lemma;
  const miss = item.search_miss_term?.trim();
  if (miss) return miss;
  return item.entity_id;
}
