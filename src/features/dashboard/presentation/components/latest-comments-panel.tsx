import { Button, Skeleton, Typography } from 'antd';
import { useLatestComments } from '@/features/comments/application/use-latest-comments';
import { formatDateTime } from '@/shared/utils/format-datetime';
import { personLabel } from '@/shared/utils/person-label';

export interface LatestCommentsPanelProps {
  enabled?: boolean;
  onNavigateAll: () => void;
  onNavigateWord?: (wordId: string) => void;
}

/**
 * Widget Analitik: 10 komentar published terbaru.
 */
export function LatestCommentsPanel({
  enabled = true,
  onNavigateAll,
  onNavigateWord,
}: LatestCommentsPanelProps) {
  const { data, isPending, isError, refetch, isFetching } = useLatestComments(10, enabled);

  if (!enabled) return null;

  return (
    <section className="dashboard__chart dashboard__comments" aria-label="10 komentar terbaru">
      <div className="dashboard__chart-header">
        <div>
          <Typography.Title level={5} className="dashboard__chart-title">
            10 komentar terbaru
          </Typography.Title>
          <Typography.Text type="secondary" className="dashboard__chart-subtitle">
            Status diterbitkan
          </Typography.Text>
        </div>
        <Button type="link" size="small" onClick={onNavigateAll}>
          Lihat semua
        </Button>
      </div>

      {isError ? (
        <div className="dashboard__comments-empty">
          <Typography.Text type="secondary">Gagal memuat komentar.</Typography.Text>{' '}
          <Button type="link" size="small" onClick={() => refetch()} loading={isFetching}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      {isPending && !data ? (
        <div className="dashboard__comments-skeleton">
          <Skeleton active paragraph={{ rows: 5 }} title={false} />
        </div>
      ) : null}

      {data && data.length === 0 ? (
        <div className="dashboard__comments-empty" role="status">
          <Typography.Text type="secondary">Belum ada komentar.</Typography.Text>
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <ul className="dashboard__comments-list">
          {data.map((item) => {
            const clickable = Boolean(onNavigateWord && item.word_id);
            const body = (
              <>
                <span className="dashboard__comments-body">{item.body}</span>
                <span className="dashboard__comments-meta">
                  {personLabel(item.display_name, item.username, 'pengguna')}
                  {item.word_lemma ? (
                    <>
                      <span aria-hidden> · </span>
                      {item.word_lemma}
                    </>
                  ) : null}
                  <span aria-hidden> · </span>
                  {formatDateTime(item.created_at)}
                </span>
              </>
            );

            return (
              <li key={item.id}>
                {clickable ? (
                  <button
                    type="button"
                    className="dashboard__comments-row dashboard__comments-row--clickable"
                    onClick={() => onNavigateWord?.(item.word_id)}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="dashboard__comments-row">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
