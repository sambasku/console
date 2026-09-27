import { Button, Skeleton, Tag, Typography } from 'antd';
import {
  DIRECTION_LABELS,
  DIRECTION_TAG_COLOR,
} from '@/features/search-miss/domain/search-miss';
import { useTopPendingSearchMisses } from '@/features/search-miss/application/use-top-pending-search-misses';

export interface TopSearchMissesPanelProps {
  onNavigateAll: () => void;
}

/**
 * Widget Analitik: top 10 pencarian 0-hasil yang belum tayang,
 * belum terpenuhi, dan belum di-dismiss.
 */
export function TopSearchMissesPanel({ onNavigateAll }: TopSearchMissesPanelProps) {
  const { data, isPending, isError, refetch, isFetching } = useTopPendingSearchMisses(10);

  return (
    <section className="dashboard__chart dashboard__misses" aria-label="Top 10 pencarian belum terpenuhi">
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            Top 10 pencarian
          </Typography.Title>
          <Typography.Text type="secondary" className="dashboard__chart-subtitle">
            Belum tayang · belum terpenuhi · belum di-dismiss
          </Typography.Text>
        </div>
        <Button type="link" size="small" onClick={onNavigateAll}>
          Lihat semua
        </Button>
      </div>

      {isError ? (
        <div className="dashboard__misses-empty">
          <Typography.Text type="secondary">Gagal memuat pencarian.</Typography.Text>{' '}
          <Button type="link" size="small" onClick={() => refetch()} loading={isFetching}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      {isPending && !data ? (
        <div className="dashboard__misses-skeleton">
          <Skeleton active paragraph={{ rows: 5 }} title={false} />
        </div>
      ) : null}

      {data && data.length === 0 ? (
        <div className="dashboard__misses-empty" role="status">
          <Typography.Text type="secondary">
            Tidak ada pencarian menunggu di antrean ini.
          </Typography.Text>
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <ol className="dashboard__misses-list">
          {data.map((item, index) => (
            <li key={item.id} className="dashboard__misses-row">
              <span className="dashboard__misses-rank" aria-hidden>
                {index + 1}
              </span>
              <div className="dashboard__misses-main">
                <span className="dashboard__misses-term">{item.term}</span>
                <Tag color={DIRECTION_TAG_COLOR[item.direction]} className="dashboard__misses-tag">
                  {DIRECTION_LABELS[item.direction]}
                </Tag>
              </div>
              <span className="dashboard__misses-hits">
                {item.searchCount.toLocaleString('id-ID')}×
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
