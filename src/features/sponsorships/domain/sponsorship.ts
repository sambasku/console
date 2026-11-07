export interface Sponsorship {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  logoUrl: string | null;
  url: string | null;
  username: string | null;
  since: string;
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
  since: string;
  note?: string;
}
