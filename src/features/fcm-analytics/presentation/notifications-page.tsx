import { useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Button, DatePicker, Result, Segmented, Tabs } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader } from '@/shared/components/page-header';
import { StagingBlocked } from '@/shared/components/staging-blocked';
import { useAuth } from '@/shared/auth/use-auth';
import { RANGE_PRESET_LABELS } from '@/features/web-analytics/domain/date-range';
import { FCM_SECTION_LABELS, FCM_SECTIONS, type FcmSection, type RangePreset } from '../domain/fcm-analytics';
import { DeliveryTab } from './components/delivery-tab';
import { EngagementTab } from './components/engagement-tab';

const routeApi = getRouteApi('/console-layout/dashboard/mobile');

/** Batas rentang custom - selaras validasi API. */
const MAX_CUSTOM_DAYS = 366;

export interface NotificationsSearch {
  tab: FcmSection;
  range: RangePreset;
  start?: string;
  end?: string;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Search params `/dashboard/mobile` - nilai asing jatuh ke default. */
export function parseNotificationsSearch(search: Record<string, unknown>): NotificationsSearch {
  const tab = FCM_SECTIONS.includes(search.tab as FcmSection) ? (search.tab as FcmSection) : 'delivery';
  const start = typeof search.start === 'string' && YMD.test(search.start) ? search.start : undefined;
  const end = typeof search.end === 'string' && YMD.test(search.end) ? search.end : undefined;
  const preset = (['7d', '28d', '90d', 'custom'] as const).includes(search.range as RangePreset)
    ? (search.range as RangePreset)
    : '28d';
  if (preset === 'custom' && (!start || !end || start > end)) return { tab, range: '28d' };
  return preset === 'custom' ? { tab, range: preset, start, end } : { tab, range: preset };
}

/** Halaman Trafik Mobile - analitik app mobile (notifikasi push + engagement). */
export function NotificationsPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['fcm-analytics'] }) > 0;
  const { user } = useAuth();
  const [customOpen, setCustomOpen] = useState(search.range === 'custom');

  if (user?.role !== 'root' && user?.role !== 'admin') {
    return (
      <Result
        status="403"
        title="Khusus admin"
        subTitle="Halaman Trafik Mobile cuma bisa dibuka admin dan root."
      />
    );
  }

  if (import.meta.env.MODE === 'staging') return <StagingBlocked title="Trafik Mobile" />;

  const setSearch = (next: NotificationsSearch) => void navigate({ to: '/dashboard/mobile', search: next });
  const query =
    search.range === 'custom'
      ? { range: 'custom' as const, start: search.start, end: search.end }
      : { range: search.range };

  const onPresetChange = (value: RangePreset) => {
    if (value === 'custom') {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    setSearch({ tab: search.tab, range: value });
  };

  const onCustomChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    const [start, end] = dates ?? [];
    if (!start || !end) return;
    setSearch({ tab: search.tab, range: 'custom', start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') });
  };

  const yesterday = dayjs().subtract(1, 'day').endOf('day');

  return (
    <div className="dashboard">
      <PageHeader
        title="Trafik Mobile"
        subtitle="Analitik aplikasi mobile SambasKu: delivery & open rate notifikasi push."
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ['fcm-analytics'] })}
          >
            Muat ulang
          </Button>
        }
      />

      <div className="traffic__toolbar">
        <Segmented<RangePreset>
          value={customOpen ? 'custom' : search.range}
          onChange={onPresetChange}
          options={(['7d', '28d', '90d', 'custom'] as const).map((p) => ({ value: p, label: RANGE_PRESET_LABELS[p] }))}
        />
        {customOpen ? (
          <DatePicker.RangePicker
            allowClear={false}
            format="D MMM YYYY"
            value={search.start && search.end ? [dayjs(search.start), dayjs(search.end)] : null}
            onChange={onCustomChange}
            disabledDate={(current, info) =>
              current.isAfter(yesterday) ||
              (info.from ? Math.abs(current.diff(info.from, 'day')) >= MAX_CUSTOM_DAYS : false)
            }
          />
        ) : null}
        <span className="traffic__toolbar-note">Data delivery tersedia dari sekitar 14 hari terakhir.</span>
      </div>

      <Tabs
        activeKey={search.tab}
        onChange={(tab) => setSearch({ ...search, tab: tab as NotificationsSearch['tab'] })}
        items={FCM_SECTIONS.map((s) => ({ key: s, label: FCM_SECTION_LABELS[s] }))}
        className="traffic__tabs"
      />

      {search.tab === 'delivery' ? <DeliveryTab query={query} /> : null}
      {search.tab === 'engagement' ? <EngagementTab query={query} /> : null}
    </div>
  );
}
