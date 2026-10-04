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
import { PLAY_SECTION_LABELS, PLAY_SECTIONS, type PlaySection, type RangePreset } from '../domain/play-analytics';
import { OverviewTab } from './components/overview-tab';
import { GrowthTab } from './components/growth-tab';
import { RatingsTab } from './components/ratings-tab';

const routeApi = getRouteApi('/console-layout/dashboard/play');

/** Batas rentang custom - selaras validasi API. */
const MAX_CUSTOM_DAYS = 366;

export interface PlaySearch {
  tab: PlaySection;
  range: RangePreset;
  start?: string;
  end?: string;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Search params `/dashboard/play` - nilai asing jatuh ke default. */
export function parsePlaySearch(search: Record<string, unknown>): PlaySearch {
  const tab = PLAY_SECTIONS.includes(search.tab as PlaySection) ? (search.tab as PlaySection) : 'overview';
  const start = typeof search.start === 'string' && YMD.test(search.start) ? search.start : undefined;
  const end = typeof search.end === 'string' && YMD.test(search.end) ? search.end : undefined;
  const preset = (['7d', '28d', '90d', 'custom'] as const).includes(search.range as RangePreset)
    ? (search.range as RangePreset)
    : '28d';
  if (preset === 'custom' && (!start || !end || start > end)) return { tab, range: '28d' };
  return preset === 'custom' ? { tab, range: preset, start, end } : { tab, range: preset };
}

/** Halaman Play Store - instal & rating dari export CSV Play Console. */
export function PlayAnalyticsPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['play-analytics'] }) > 0;
  const { user } = useAuth();
  const [customOpen, setCustomOpen] = useState(search.range === 'custom');

  if (user?.role !== 'root' && user?.role !== 'admin') {
    return (
      <Result
        status="403"
        title="Khusus admin"
        subTitle="Halaman Play Store cuma bisa dibuka admin dan root."
      />
    );
  }

  if (import.meta.env.MODE === 'staging') return <StagingBlocked title="Play Store" />;

  const setSearch = (next: PlaySearch) => void navigate({ to: '/dashboard/play', search: next });
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
        title="Play Store"
        subtitle="Instal, uninstall, dan rating aplikasi SambasKu di Google Play."
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ['play-analytics'] })}
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
        <span className="traffic__toolbar-note">Data Play final 1-2 hari setelah tanggalnya.</span>
      </div>

      <Tabs
        activeKey={search.tab}
        onChange={(tab) => setSearch({ ...search, tab: tab as PlaySearch['tab'] })}
        items={PLAY_SECTIONS.map((s) => ({ key: s, label: PLAY_SECTION_LABELS[s] }))}
        className="traffic__tabs"
      />

      {search.tab === 'overview' ? <OverviewTab query={query} /> : null}
      {search.tab === 'growth' ? <GrowthTab query={query} /> : null}
      {search.tab === 'ratings' ? <RatingsTab query={query} /> : null}
    </div>
  );
}
