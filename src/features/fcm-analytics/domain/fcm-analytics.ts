/**
 * Kontrak GET /api/v1/admin/fcm-analytics/:section. API sudah menormalisasi
 * data Firebase (FCM Data API + GA4) ke bentuk ini; console memakai bentuk
 * wire (snake_case) apa adanya tanpa mapper.
 */

export const FCM_SECTIONS = ['delivery', 'engagement'] as const;
export type FcmSection = (typeof FCM_SECTIONS)[number];

export const FCM_SECTION_LABELS: Record<FcmSection, string> = {
  delivery: 'Delivery',
  engagement: 'Engagement',
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

export interface FcmProviderResult<T> {
  status: ProviderStatus;
  error_code: string | null;
  message: string | null;
  range: DateRangeWire | null;
  data: T | null;
}

export interface FcmTotals {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  open_rate: number;
}

export interface FcmTrendPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
}

export interface FcmDelivery {
  totals: FcmTotals;
  previous: FcmTotals;
  trend: FcmTrendPoint[];
  /** Tanggal data delivery terakhir (umumnya H-1); null kalau kosong. */
  latest_data_date: string | null;
}

export interface FcmEngagement extends FcmDelivery {
  /** Rata-rata detik di app setelah buka notifikasi. */
  avg_engagement_seconds: number;
}

export interface FcmReport<T = FcmDelivery | FcmEngagement> {
  section: FcmSection;
  range: {
    start: string;
    end: string;
    previous_start: string;
    previous_end: string;
    days: number;
  };
  fcm: FcmProviderResult<T>;
}
