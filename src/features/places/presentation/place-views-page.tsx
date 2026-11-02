import { useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Result, Segmented, Skeleton, Space, Tag, Typography } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { useAuth } from '@/shared/auth/use-auth';
import { TrendChart } from '@/features/web-analytics/presentation/components/trend-chart';
import { usePlaceViewsReport } from '../application/use-places';
import { fillTrendDays, toPlaceViewsKpis } from '../application/place-views-mappers';

const PERIODS = [
  { value: 7, label: '7 hari' },
  { value: 30, label: '30 hari' },
] as const;

const TOP_N = 10;

/**
 * Analitik wisata - view detail place dari web + mobile (place_views).
 * Styling mengikuti Ringkasan: KPI card + chart tren + ranked list.
 */
export function PlaceViewsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState<number>(30);
  const report = usePlaceViewsReport(days);

  if (user?.role !== 'root' && user?.role !== 'admin' && user?.role !== 'reviewer') {
    return (
      <Result
        status="403"
        title="Khusus admin"
        subTitle="Halaman analitik wisata cuma bisa dibuka admin, root, atau reviewer."
      />
    );
  }

  const data = report.data;
  const kpis = data ? toPlaceViewsKpis(data) : null;
  const trend = data ? fillTrendDays(data, days) : [];
  const top = (data?.items ?? []).slice(0, TOP_N);

  const kpiItems: Array<{ key: string; label: string; value: string; meta: string }> = kpis
    ? [
        {
          key: 'total',
          label: 'Total pembaca unik',
          value: kpis.totalViews.toLocaleString('id-ID'),
          meta: `${days} hari terakhir (WIB)`,
        },
        {
          key: 'top',
          label: 'Paling sering dilihat',
          value: kpis.topName ? kpis.topViews.toLocaleString('id-ID') : '-',
          meta: kpis.topName
            ? kpis.topName
            : `Belum ada halaman wisata yang dibuka di ${days} hari terakhir`,
        },
        {
          key: 'active',
          label: 'Tempat aktif',
          value: kpis.activePlaces.toLocaleString('id-ID'),
          meta: 'Tempat tayang yang pernah dibuka',
        },
        {
          key: 'avg',
          label: 'Rata-rata per tempat',
          value: kpis.activePlaces > 0 ? kpis.avgViews.toLocaleString('id-ID') : '-',
          meta: 'View per tempat',
        },
      ]
    : [];

  return (
    <div className="dashboard">
      <PageHeader
        title="Analitik Wisata"
        subtitle="Pembaca unik harian halaman detail wisata di web dan mobile - 1 orang dihitung sekali per hari walau refresh berkali-kali."
        extra={
          <Space>
            <Segmented
              value={days}
              onChange={(v) => setDays(v as number)}
              options={PERIODS as unknown as Array<{ value: number; label: string }>}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => report.refetch()}
              loading={report.isFetching && !report.isPending}
            >
              Muat ulang
            </Button>
          </Space>
        }
      />

      {report.isError ? (
        <Alert
          type="error"
          showIcon
          message="Analitik wisata gagal dimuat"
          description="Cek koneksi internet kamu, lalu coba lagi."
          action={
            <Button size="small" onClick={() => report.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {report.isPending && !data ? (
        <div className="dashboard__kpi dashboard__kpi--skeleton">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton.Input key={i} active block style={{ height: 88 }} />
          ))}
        </div>
      ) : null}

      {kpis ? (
        <div className="dashboard__kpi" role="list">
          {kpiItems.map((item) => (
            <div key={item.key} role="listitem" className="dashboard__kpi-cell">
              <div className="dashboard__kpi-card">
                <span className="dashboard__kpi-label">{item.label}</span>
                <span className="dashboard__kpi-value">{item.value}</span>
                <span className="dashboard__kpi-meta">{item.meta}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {report.isPending && !data ? (
        <div className="dashboard__charts dashboard__charts--skeleton">
          <Skeleton active paragraph={{ rows: 6 }} title={{ width: 180 }} />
        </div>
      ) : null}

      {data ? (
        <div className="dashboard__charts">
          <TrendChart
            title="Pembaca unik per hari"
            subtitle={`${days} hari terakhir (WIB) · web + mobile digabung`}
            points={trend.map((p) => ({ date: p.day, total: p.total }))}
              series={[{ key: 'total', label: 'Pembaca' }]}
          />

          <section className="dashboard__chart dashboard__misses" aria-label="Top wisata terpopuler">
            <div className="dashboard__chart-header">
              <div>
                <Typography.Title level={5} className="dashboard__chart-title">
                  Top {TOP_N} wisata
                </Typography.Title>
                <Typography.Text type="secondary" className="dashboard__chart-subtitle">
                  Diurut dari yang paling sering dibuka
                </Typography.Text>
              </div>
            </div>
            {top.length === 0 ? (
              <div className="dashboard__misses-empty" role="status">
                <Typography.Text type="secondary">
                  Belum ada yang membuka halaman wisata pada periode ini.
                </Typography.Text>
              </div>
            ) : (
              <ol className="dashboard__misses-list">
                {top.map((item, index) => (
                  <li key={item.placeId} className="dashboard__misses-row">
                    <span className="dashboard__misses-rank" aria-hidden>
                      {index + 1}
                    </span>
                    <div className="dashboard__misses-main">
                      <span className="dashboard__misses-term">{item.name}</span>
                      <Tag className="dashboard__misses-tag">{item.category}</Tag>
                    </div>
                    <span className="dashboard__misses-hits">
                      {item.views.toLocaleString('id-ID')}×
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
