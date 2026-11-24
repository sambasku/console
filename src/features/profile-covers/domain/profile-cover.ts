export type ProfileCoverVariant = 'tab' | 'public' | 'wotd';

export interface ProfileCover {
  id: string;
  variant: ProfileCoverVariant;
  url: string;
  file_id: string | null;
  width: number;
  height: number;
  size_bytes: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  activated_at: string | null;
}

export const PROFILE_COVER_SPECS: Record<
  ProfileCoverVariant,
  { width: number; height: number; label: string; aspect: number }
> = {
  tab: {
    width: 1032,
    height: 400,
    label: 'Tab Profil',
    aspect: 1032 / 400,
  },
  public: {
    width: 1032,
    height: 534,
    label: 'Profil publik',
    aspect: 1032 / 534,
  },
  wotd: {
    width: 600,
    height: 338,
    label: 'Kata Hari Ini (kartu Home)',
    aspect: 600 / 338,
  },
};