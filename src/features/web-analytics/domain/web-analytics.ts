/**
 * Kontrak GET /api/v1/admin/web-analytics/:section. API sudah menormalisasi
 * respons GA4 / Search Console ke bentuk ini, jadi console memakai bentuk
 * wire (snake_case) apa adanya tanpa mapper.
 */

export const WEB_ANALYTICS_SECTIONS = ['overview', 'visitors', 'behavior', 'search', 'sources'] as const;
export type WebAnalyticsSection = (typeof WEB_ANALYTICS_SECTIONS)[number];

export const SECTION_LABELS: Record<WebAnalyticsSection, string> = {
  overview: 'Ikhtisar',
  visitors: 'Pengunjung',
  behavior: 'Perilaku',
  search: 'Pencarian',
  sources: 'Sumber Trafik',
};

export const RANGE_PRESETS = ['7d', '28d', '90d', 'custom'] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export interface RangeQuery {
  range: RangePreset;
  start?: string;
  end?: string;
}

export interface DateRangeWire {
  start: string;
  end: string;
}

export type ProviderStatus = 'ok' | 'empty' | 'not_configured' | 'error';

export interface ProviderResult<T> {
  status: ProviderStatus;
  error_code: string | null;
  message: string | null;
  range: DateRangeWire | null;
  data: T | null;
}

export interface Ga4Totals {
  active_users: number;
  total_users: number;
  new_users: number;
  sessions: number;
  page_views: number;
  event_count: number;
  engagement_rate: number;
}

export interface Ga4TrendPoint {
  date: string;
  active_users: number;
  sessions: number;
  page_views: number;
}

export interface PageRow {
  path: string;
  views: number;
  users: number;
}

export interface LandingPageRow {
  path: string;
  sessions: number;
  engagement_rate: number;
}

export interface EventRow {
  name: string;
  count: number;
  users: number;
}

export interface BreakdownRow {
  key: string;
  users: number;
  sessions: number;
}

export type TrafficChannel = 'organic_search' | 'direct' | 'social' | 'referral' | 'other';

export interface ChannelRow {
  channel: TrafficChannel;
  sessions: number;
  share: number;
}

export interface Ga4Overview {
  totals: Ga4Totals;
  previous: Ga4Totals;
  trend: Ga4TrendPoint[];
  top_pages: PageRow[];
}

export interface Ga4Visitors {
  totals: Ga4Totals;
  previous: Ga4Totals;
  trend: Ga4TrendPoint[];
  devices: BreakdownRow[];
  countries: BreakdownRow[];
}

export interface Ga4Behavior {
  totals: Ga4Totals;
  previous: Ga4Totals;
  top_pages: PageRow[];
  landing_pages: LandingPageRow[];
  events: EventRow[];
}

export interface Ga4Sources {
  total_sessions: number;
  channels: ChannelRow[];
}

export interface SearchTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchTrendPoint {
  date: string;
  clicks: number;
  impressions: number;
}

export interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchOverview {
  totals: SearchTotals;
  previous: SearchTotals;
  trend: SearchTrendPoint[];
  top_queries: QueryRow[];
}

export interface SearchDetail extends SearchOverview {
  top_pages: SearchPageRow[];
}

export interface SectionReport<G = never, S = never> {
  section: WebAnalyticsSection;
  range: {
    start: string;
    end: string;
    previous_start: string;
    previous_end: string;
    days: number;
  };
  ga4?: ProviderResult<G>;
  search_console?: ProviderResult<S>;
}

export interface SectionReportMap {
  overview: SectionReport<Ga4Overview, SearchOverview>;
  visitors: SectionReport<Ga4Visitors>;
  behavior: SectionReport<Ga4Behavior>;
  search: SectionReport<never, SearchDetail>;
  sources: SectionReport<Ga4Sources>;
}

export const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  organic_search: 'Organic Search',
  direct: 'Direct',
  social: 'Social Media',
  referral: 'Referral',
  other: 'Lainnya',
};
