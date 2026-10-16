/**
 * Kontrak GET /api/v1/admin/mobile-analytics/:section. API sudah menormalisasi
 * data GA4 property mobile ke bentuk ini; console memakai bentuk wire
 * (snake_case) apa adanya tanpa mapper.
 */

export const MOBILE_SECTIONS = ['overview', 'events', 'screens', 'audience'] as const;
export type MobileSection = (typeof MOBILE_SECTIONS)[number];

export const MOBILE_SECTION_LABELS: Record<MobileSection, string> = {
  overview: 'Ikhtisar',
  events: 'Event',
  screens: 'Layar',
  audience: 'Audiens',
};

export interface MobileTotals {
  active_users: number;
  total_users: number;
  new_users: number;
  sessions: number;
  event_count: number;
  engagement_rate: number;
}

export interface MobileTrendPoint {
  date: string;
  active_users: number;
  sessions: number;
  event_count: number;
}

export interface EventRow {
  name: string;
  count: number;
  users: number;
}

export interface ScreenRow {
  name: string;
  views: number;
  users: number;
}

export interface PlatformRow {
  platform: 'android' | 'ios';
  users: number;
  sessions: number;
  share: number;
}

export interface AppVersionRow {
  version: string;
  users: number;
  sessions: number;
  share: number;
}

export interface CountryRow {
  country: string;
  users: number;
  sessions: number;
  share: number;
}

interface MobileBase {
  totals: MobileTotals;
  previous: MobileTotals;
  trend: MobileTrendPoint[];
}

export interface MobileOverview extends MobileBase {
  top_events: EventRow[];
  top_screens: ScreenRow[];
}

export interface MobileEvents extends MobileBase {
  events: EventRow[];
}

export interface MobileScreens extends MobileBase {
  screens: ScreenRow[];
}

export interface MobileAudience extends MobileBase {
  platforms: PlatformRow[];
  app_versions: AppVersionRow[];
  countries: CountryRow[];
}

export interface MobileSectionData {
  overview: MobileOverview;
  events: MobileEvents;
  screens: MobileScreens;
  audience: MobileAudience;
}

/** Sama bentuk dengan FcmProviderResult - komponen state FCM dipakai ulang. */
export interface MobileReport<T> {
  section: MobileSection;
  range: {
    start: string;
    end: string;
    previous_start: string;
    previous_end: string;
    days: number;
  };
  mobile: {
    status: 'ok' | 'empty' | 'not_configured' | 'error';
    error_code: string | null;
    message: string | null;
    range: { start: string; end: string } | null;
    data: T | null;
  };
}
