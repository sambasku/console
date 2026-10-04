import { useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Button, DatePicker, Result, Segmented, Tabs } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader } from '@/shared/components/page-header';
import { StagingBlocked } from '@/shared/components/staging-blocked';
import { useAuth } from '@/shared/auth/use-auth';
import { RANGE_PRESET_LABELS, toRangeQuery, type TrafficSearch } from '../domain/date-range';
import { RANGE_PRESETS, SECTION_LABELS, WEB_ANALYTICS_SECTIONS, type RangePreset } from '../domain/web-analytics';
import { OverviewTab } from './tabs/overview-tab';
import { VisitorsTab } from './tabs/visitors-tab';
import { BehaviorTab } from './tabs/behavior-tab';
import { SearchTab } from './tabs/search-tab';
import { SourcesTab } from './tabs/sources-tab';

const routeApi = getRouteApi('/console-layout/dashboard/traffic');

/** Batas rentang custom - selaras validasi API. */
const MAX_CUSTOM_DAYS = 366;

/**
 * Trafik Web - pengunjung (GA4) + performa pencarian (Search Console) dalam
 * satu halaman bertab. Tab & rentang tanggal disimpan di URL supaya bisa
 * dibagikan / di-bookmark. Hanya tab aktif yang di-render (satu request).
 */
export function WebAnalyticsPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['web-analytics'] }) > 0;
  const { user } = useAuth();
  const [customOpen, setCustomOpen] = useState(search.range === 'custom');

  if (user?.role !== 'root' && user?.role !== 'admin') {
    return (
      <Result
        status="403"
        title="Khusus admin"
        subTitle="Halaman Trafik Web cuma bisa dibuka admin dan root."
      />
    );
  }

  if (import.meta.env.MODE === 'staging') return <StagingBlocked title="Trafik Web" />;

  const setSearch = (next: TrafficSearch) => void navigate({ to: '/dashboard/traffic', search: next });
  const query = toRangeQuery(search);

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
        title="Trafik Web"
        subtitle="Pengunjung dan performa pencarian situs SambasKu."
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ['web-analytics'] })}
          >
            Muat ulang
          </Button>
        }
      />

      <div className="traffic__toolbar">
        <Segmented<RangePreset>
          value={customOpen ? 'custom' : search.range}
          onChange={onPresetChange}
          options={RANGE_PRESETS.map((p) => ({ value: p, label: RANGE_PRESET_LABELS[p] }))}
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
        <span className="traffic__toolbar-note">Dibandingkan dengan periode sebelumnya yang sama panjang.</span>
      </div>

      <Tabs
        activeKey={search.tab}
        onChange={(tab) => setSearch({ ...search, tab: tab as TrafficSearch['tab'] })}
        items={WEB_ANALYTICS_SECTIONS.map((s) => ({ key: s, label: SECTION_LABELS[s] }))}
        className="traffic__tabs"
      />

      {search.tab === 'overview' ? <OverviewTab query={query} /> : null}
      {search.tab === 'visitors' ? <VisitorsTab query={query} /> : null}
      {search.tab === 'behavior' ? <BehaviorTab query={query} /> : null}
      {search.tab === 'search' ? <SearchTab query={query} /> : null}
      {search.tab === 'sources' ? <SourcesTab query={query} /> : null}
    </div>
  );
}
