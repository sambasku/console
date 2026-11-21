import { useState } from 'react';
import { Alert, Segmented, Skeleton, Space, Typography } from 'antd';
import { TrendChart } from '@/features/web-analytics/presentation/components/trend-chart';
import { useWordViewSeries } from '../application/use-word-views';
import { fillWordSeriesDays } from '../application/word-views-mappers';

const PERIODS = [
  { value: 7, label: '7 hari' },
  { value: 30, label: '30 hari' },
] as const;

/**
 * Kartu tren pembaca unik di detail lemma (admin/root/reviewer).
 * Sumber: GET /admin/words/:id/views - bukan halaman Analitik agregat.
 */
export function WordDetailViewsCard({ wordId }: { wordId: string }) {
  const [days, setDays] = useState<number>(30);
  const series = useWordViewSeries(wordId, days);

  if (series.isError) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Gagal memuat tren dilihat"
        description={series.error instanceof Error ? series.error.message : undefined}
        style={{ marginBottom: 16 }}
      />
    );
  }

  const points = series.data
    ? fillWordSeriesDays(series.data, days).map((p) => ({
        date: p.day,
        views: p.total,
      }))
    : [];
  const total = series.data?.total ?? 0;
  const lastViewed = series.data?.lastViewed;

  return (
    <div style={{ marginBottom: 24 }}>
      <Space
        style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}
        wrap
      >
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Dilihat
          </Typography.Title>
          <Typography.Text type="secondary">
            Pembaca unik per hari (WIB). Total{' '}
            <Typography.Text strong>{total.toLocaleString('id-ID')}</Typography.Text>
            {lastViewed ? ` · terakhir ${lastViewed}` : ''}
          </Typography.Text>
        </div>
        <Segmented
          value={days}
          options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
          onChange={(v) => setDays(Number(v))}
        />
      </Space>
      {series.isPending ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <TrendChart
          title=""
          points={points}
          series={[{ key: 'views', label: 'Pembaca unik' }]}
          height={200}
        />
      )}
    </div>
  );
}
