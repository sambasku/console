/**
 * Kontrak GET /api/v1/admin/play-analytics/:section. API sudah menormalisasi
 * export CSV Play Console ke bentuk ini; console memakai bentuk wire
 * (snake_case) apa adanya tanpa mapper.
 */

export const PLAY_SECTIONS = ['overview', 'growth', 'ratings'] as const;
export type PlaySection = (typeof PLAY_SECTIONS)[number];

export const PLAY_SECTION_LABELS: Record<PlaySection, string> = {
  overview: 'Ikhtisar',
  growth: 'Pertumbuhan',
  ratings: 'Rating',
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

export interface PlayProviderResult<T> {
  status: ProviderStatus;
  error_code: string | null;
  message: string | null;
  range: DateRangeWire | null;
  data: T | null;
}

export interface PlayTotals {
  new_installs: number;
  active_installs: number;
  uninstalls: number;
  updates: number;
  average_rating: number;
  rating_count: number;
}

export interface PlayTrendPoint {
  date: string;
  installs: number;
  uninstalls: number;
}

export interface PlayCountryRow {
  country: string;
  installs: number;
}

export interface PlayOverview {
  totals: PlayTotals;
  previous: PlayTotals;
  trend: PlayTrendPoint[];
  top_countries: PlayCountryRow[];
}

export interface PlayGrowth extends PlayOverview {
  net_trend: Array<{ date: string; net: number }>;
}

export interface PlayRatingBucket {
  stars: number;
  count: number;
  share: number;
}

export interface PlayRatings {
  totals: PlayTotals;
  previous: PlayTotals;
  buckets: PlayRatingBucket[];
}

export interface PlayReport<T = PlayOverview | PlayGrowth | PlayRatings> {
  section: PlaySection;
  range: {
    start: string;
    end: string;
    previous_start: string;
    previous_end: string;
    days: number;
  };
  play: PlayProviderResult<T>;
}
