import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { Alert, Button, Skeleton } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { useAuth } from '@/shared/auth/use-auth';
import { ROLE_LABELS, type UserRole } from '@/features/auth/domain/user';
import { useDashboardStats } from '../application/use-dashboard-stats';
import { StatCards } from './components/stat-cards';
import { ActivityDailyChart } from './components/activity-daily-chart';
import { ProblemsDonutChart } from './components/problems-donut-chart';
import { WordOfDayCard } from '@/features/word-of-day/presentation/word-of-day-card';

/**
 * Dashboard - strip KPI + chart aktivitas + donut permasalahan.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats, isPending, isError, isFetching, refetch } = useDashboardStats();

  const role = user?.role as UserRole | undefined;
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : null;
  const subtitle = [user?.username ? `Halo, ${user.username}` : null, roleLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="dashboard">
      <PageHeader
        title="Dashboard"
        subtitle={subtitle || 'Ringkasan konsol admin.'}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching && !isPending}
          >
            Muat ulang
          </Button>
        }
      />

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Statistik gagal dimuat"
          description="Periksa koneksi lalu coba lagi."
          action={
            <Button size="small" onClick={() => refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      <WordOfDayCard />

      {isPending && !stats ? (
        <div className="dashboard__strip dashboard__strip--skeleton">
          <Skeleton.Input active size="small" style={{ width: 280 }} />
        </div>
      ) : null}

      {stats ? (
        <StatCards
          stats={stats}
          onNavigateContributions={() => navigate({ to: '/contributions', search: { id: undefined } })}
        />
      ) : null}

      {isPending && !stats ? (
        <div className="dashboard__charts dashboard__charts--skeleton">
          <Skeleton active paragraph={{ rows: 6 }} title={{ width: 180 }} />
        </div>
      ) : null}

      {stats ? (
        <div className="dashboard__charts">
          <div className="dashboard__charts-main">
            <ActivityDailyChart points={stats.activity.dailyLast30Days} />
          </div>
          <div className="dashboard__charts-side">
            <ProblemsDonutChart
              problems={stats.problems}
              onNavigate={() => navigate({ to: '/bug-reports' })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
