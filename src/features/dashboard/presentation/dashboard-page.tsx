import { ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Alert, Button, Skeleton } from 'antd';
import { PageHeader } from '@/shared/components/page-header';
import { StagingBlocked } from '@/shared/components/staging-blocked';
import { useAuth } from '@/shared/auth/use-auth';
import { ROLE_LABELS, type UserRole } from '@/features/auth/domain/user';
import { useDashboardStats } from '../application/use-dashboard-stats';
import { StatCards } from './components/stat-cards';
import { AttentionQueue } from './components/attention-queue';
import { TodayVsYesterday } from './components/today-vs-yesterday';
import { ActivityDailyChart } from './components/activity-daily-chart';
import { ProblemsStatusBars } from './components/problems-status-bars';
import { VerifierApplicationsStatusBars } from './components/verifier-applications-status-bars';
import { WordsStatusBars } from './components/words-status-bars';
import { TopSearchMissesPanel } from './components/top-search-misses-panel';
import { LatestCommentsPanel } from './components/latest-comments-panel';
import { TopPendingContributionsPanel } from './components/top-pending-contributions-panel';

/**
 * Analitik - KPI + perlu tindakan + hari ini vs kemarin + chart + list 3 kolom.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isStaging = import.meta.env.MODE === 'staging';

  // enabled: false di staging - hook tetap terpasang (aturan hooks), tapi
  // tidak ada request API yang terpicu; halaman diganti blocker di bawah.
  const { data: stats, isPending, isError, isFetching, refetch } = useDashboardStats({ enabled: !isStaging });

  if (isStaging) return <StagingBlocked title="Ringkasan" />;

  const role = user?.role as UserRole | undefined;
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : null;
  const subtitle = [
    user?.username
      ? `Halo, ${user.display_name?.trim() || user.username}`
      : null,
    roleLabel,
  ]
    .filter(Boolean)
    .join(' · ');
  const canManageUsers = role === 'root' || role === 'admin';
  const canModerate =
    role === 'root' || role === 'admin' || role === 'reviewer';

  const goWords = () => navigate({ to: '/words' });
  const goWord = (wordId: string) => navigate({ to: '/words/$id', params: { id: wordId } });
  const goContributions = () => navigate({ to: '/contributions', search: { id: undefined } });
  const goContribution = (id: string) =>
    navigate({ to: '/contributions', search: { id } });
  const goUsers = () => navigate({ to: '/users' });
  const goAuditLogs = () => navigate({ to: '/audit-logs' });
  const goProblems = () => navigate({ to: '/bug-reports' });
  const goVerifier = () => navigate({ to: '/verifier-applications' });
  const goSearchMisses = () => navigate({ to: '/search-misses' });
  const goComments = () => navigate({ to: '/comments' });

  const onReload = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ['search-misses', 'top-pending'] });
    void queryClient.invalidateQueries({ queryKey: ['contributions', 'top-pending'] });
    void queryClient.invalidateQueries({ queryKey: ['comments', 'latest'] });
  };

  return (
    <div className="dashboard">
      <PageHeader
        title="Analitik"
        subtitle={subtitle || 'Ringkasan operasional konsol.'}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={onReload}
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
          description="Cek koneksi internet kamu, lalu coba lagi."
          action={
            <Button size="small" onClick={() => refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {isPending && !stats ? (
        <div className="dashboard__kpi dashboard__kpi--skeleton">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton.Input key={i} active block style={{ height: 88 }} />
          ))}
        </div>
      ) : null}

      {stats ? (
        <StatCards
          stats={stats}
          onNavigateWords={goWords}
          onNavigateContributions={goContributions}
          onNavigateUsers={canManageUsers ? goUsers : undefined}
          onNavigateAuditLogs={goAuditLogs}
        />
      ) : null}

      {stats ? (
        <div className="dashboard__meta-row">
          <AttentionQueue
            stats={stats}
            onNavigateContributions={goContributions}
            onNavigateWords={goWords}
            onNavigateProblems={goProblems}
            onNavigateVerifierApplications={goVerifier}
          />
          <TodayVsYesterday points={stats.activity.dailyLast30Days} />
        </div>
      ) : null}

      {isPending && !stats ? (
        <div className="dashboard__charts dashboard__charts--skeleton">
          <Skeleton active paragraph={{ rows: 6 }} title={{ width: 180 }} />
        </div>
      ) : null}

      {stats ? (
        <div className="dashboard__charts">
          <ActivityDailyChart points={stats.activity.dailyLast30Days} />
          <div className="dashboard__breakdowns">
            <WordsStatusBars words={stats.words} onNavigate={goWords} />
            <ProblemsStatusBars problems={stats.problems} onNavigate={goProblems} />
            <VerifierApplicationsStatusBars
              stats={stats.verifierApplications}
              onNavigate={goVerifier}
            />
          </div>
          <div className="dashboard__lists-section">
            <div className="dashboard__lists-heading">
              <h3 className="dashboard__lists-title">Antrean & aktivitas terbaru</h3>
              <p className="dashboard__lists-subtitle">
                Pencarian kosong, komentar baru, dan usulan menunggu review
              </p>
            </div>
            <div
              className={
                canModerate ? 'dashboard__lists' : 'dashboard__lists dashboard__lists--single'
              }
            >
              <TopSearchMissesPanel onNavigateAll={goSearchMisses} />
              <LatestCommentsPanel
                enabled={canModerate}
                onNavigateAll={goComments}
                onNavigateWord={goWord}
              />
              <TopPendingContributionsPanel
                enabled={canModerate}
                onNavigateAll={goContributions}
                onNavigateItem={goContribution}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
