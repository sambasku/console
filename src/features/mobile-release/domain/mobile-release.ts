export type MobileReleasePlatform = 'android' | 'ios';

export interface MobileRelease {
  id: string;
  platform: MobileReleasePlatform;
  version: string;
  storeUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}
