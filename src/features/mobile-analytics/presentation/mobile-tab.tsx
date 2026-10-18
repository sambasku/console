import { Table, Typography } from 'antd';
import { resolveFcmView } from '@/features/fcm-analytics/application/fcm-provider-state';
import type { RangeQuery } from '@/features/fcm-analytics/domain/fcm-analytics';
import { FcmKpiGrid } from '@/features/fcm-analytics/presentation/components/fcm-kpi-grid';
import { FcmRequestErrorAlert } from '@/features/fcm-analytics/presentation/components/fcm-request-error-alert';
import { FcmSection } from '@/features/fcm-analytics/presentation/components/fcm-section';
import { FcmTrendChart } from '@/features/fcm-analytics/presentation/components/fcm-trend-chart';
import { fmtInt } from '@/features/fcm-analytics/presentation/components/format';
import { useMobileAnalytics } from '../application/use-mobile-analytics';
import type { MobileSection, MobileTotals } from '../domain/mobile-analytics';

const COPY = {
  source: 'Data dari Google Analytics (GA4) aplikasi mobile',
  notConfiguredTitle: 'Analitik mobile belum terhubung',
  notConfiguredDesc: 'Isi MOBILE_GA4_PROPERTY_ID dan service account GA4 di env API, lalu redeploy.',
  emptyTitle: 'Belum ada data aplikasi mobile',
  emptyDesc: 'Belum ada aktivitas di rentang ini, atau datanya belum diproses Google (lambat sekitar 1 hari).',
  errorTitle: 'Data analitik mobile belum bisa dimuat',
};

const pct = (n: number) => `${n.toFixed(1)}%`;

function Kpis({ t, p }: { t: MobileTotals; p: MobileTotals }) {
  return (
    <FcmKpiGrid
      items={[
        { key: 'au', label: 'Pengguna aktif', value: t.active_users, previous: p.active_users, format: fmtInt },
        { key: 'nu', label: 'Pengguna baru', value: t.new_users, previous: p.new_users, format: fmtInt },
        { key: 'ss', label: 'Sesi', value: t.sessions, previous: p.sessions, format: fmtInt },
        { key: 'ev', label: 'Event', value: t.event_count, previous: p.event_count, format: fmtInt },
      ]}
    />
  );
}

const SERIES = [
  { key: 'active_users' as const, label: 'Pengguna aktif' },
  { key: 'sessions' as const, label: 'Sesi' },
];

const num = (v: number) => fmtInt(v);

/** Satu komponen untuk 4 tab GA4 mobile; beda cuma isi tabel di bawah KPI + tren. */
export function MobileTab({ section, query }: { section: MobileSection; query: RangeQuery }) {
  const q = useMobileAnalytics(section, query);
  const retry = () => void q.refetch();
  if (q.isError && !q.data) return <FcmRequestErrorAlert error={q.error} onRetry={retry} />;
  const view = resolveFcmView({ isPending: q.isPending, result: q.data?.mobile as never });

  return (
    <FcmSection view={view} range={q.data?.mobile.range} onRetry={retry} copy={COPY}>
      {(raw) => {
        // ponytail: union di-narrow lewat `section` (API menjamin pasangan section-data).
        const d = raw as Record<string, never>;
        const base = raw as unknown as { totals: MobileTotals; previous: MobileTotals; trend: never[] };
        return (
          <>
            <Kpis t={base.totals} p={base.previous} />
            <FcmTrendChart title="Aktivitas harian" points={base.trend} series={SERIES} />
            {section === 'overview' || section === 'events' ? (
              <Table
                size="small"
                pagination={false}
                rowKey="name"
                title={() => <Typography.Text strong>Event teratas</Typography.Text>}
                dataSource={(d.events ?? d.top_events) as unknown as Array<{ name: string; count: number; users: number }>}
                columns={[
                  { title: 'Event', dataIndex: 'name' },
                  { title: 'Jumlah', dataIndex: 'count', align: 'right', render: num },
                  { title: 'Pengguna', dataIndex: 'users', align: 'right', render: num },
                ]}
              />
            ) : null}
            {section === 'overview' || section === 'screens' ? (
              <Table
                size="small"
                pagination={false}
                rowKey="name"
                title={() => <Typography.Text strong>Layar teratas</Typography.Text>}
                dataSource={(d.screens ?? d.top_screens) as unknown as Array<{ name: string; views: number; users: number }>}
                columns={[
                  { title: 'Layar', dataIndex: 'name' },
                  { title: 'Tampilan', dataIndex: 'views', align: 'right', render: num },
                  { title: 'Pengguna', dataIndex: 'users', align: 'right', render: num },
                ]}
              />
            ) : null}
            {section === 'audience' ? (
              <>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="platform"
                  title={() => <Typography.Text strong>Platform</Typography.Text>}
                  dataSource={d.platforms as unknown as Array<{ platform: string; users: number; sessions: number; share: number }>}
                  columns={[
                    { title: 'Platform', dataIndex: 'platform' },
                    { title: 'Pengguna', dataIndex: 'users', align: 'right', render: num },
                    { title: 'Sesi', dataIndex: 'sessions', align: 'right', render: num },
                    { title: 'Porsi', dataIndex: 'share', align: 'right', render: (s: number) => pct(s * 100) },
                  ]}
                />
                <Table
                  size="small"
                  pagination={false}
                  rowKey="version"
                  title={() => <Typography.Text strong>Versi aplikasi</Typography.Text>}
                  dataSource={d.app_versions as unknown as Array<{ version: string; users: number; sessions: number; share: number }>}
                  columns={[
                    { title: 'Versi', dataIndex: 'version' },
                    { title: 'Pengguna', dataIndex: 'users', align: 'right', render: num },
                    { title: 'Sesi', dataIndex: 'sessions', align: 'right', render: num },
                    { title: 'Porsi', dataIndex: 'share', align: 'right', render: (s: number) => pct(s * 100) },
                  ]}
                />
                <Table
                  size="small"
                  pagination={false}
                  rowKey="country"
                  title={() => <Typography.Text strong>Negara</Typography.Text>}
                  dataSource={d.countries as unknown as Array<{ country: string; users: number; sessions: number; share: number }>}
                  columns={[
                    { title: 'Negara', dataIndex: 'country' },
                    { title: 'Pengguna', dataIndex: 'users', align: 'right', render: num },
                    { title: 'Sesi', dataIndex: 'sessions', align: 'right', render: num },
                    { title: 'Porsi', dataIndex: 'share', align: 'right', render: (s: number) => pct(s * 100) },
                  ]}
                />
              </>
            ) : null}
          </>
        );
      }}
    </FcmSection>
  );
}
