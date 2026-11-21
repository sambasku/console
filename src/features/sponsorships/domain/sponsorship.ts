export type SponsorshipTier = 'perak' | 'emas' | 'intan' | 'mustika';

export const SPONSORSHIP_TIER_OPTIONS: { value: SponsorshipTier; label: string }[] = [
  { value: 'perak', label: 'Perak' },
  { value: 'emas', label: 'Emas' },
  { value: 'intan', label: 'Intan' },
  { value: 'mustika', label: 'Mustika' },
];

export interface Sponsorship {
  id: string;
  userId: string | null;
  usahaId: string | null;
  name: string;
  description: string | null;
  logoUrl: string | null;
  url: string | null;
  username: string | null;
  tier: SponsorshipTier;
  since: string;
  endsOn: string | null;
  note: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface SponsorshipInput {
  name: string;
  description?: string | null;
  logo_url?: string | null;
  url?: string | null;
  username?: string | null;
  tier?: SponsorshipTier;
  since: string;
  ends_on?: string | null;
  note?: string;
  user_id?: string | null;
  usaha_id?: string | null;
}
