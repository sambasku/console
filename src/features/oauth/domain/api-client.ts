export type ApiClientStatus = 'pending' | 'approved' | 'suspended' | 'revoked';
export type ApiClientChannel = 'web' | 'mobile';

export const ALL_SCOPES = [
  'vote.write',
  'comment.write',
  'contribute.write',
  'discussion.write',
  'bookmark.write',
  'profile.read',
  'device.write',
] as const;

export type ApiClientScope = (typeof ALL_SCOPES)[number];

export interface ApiClient {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  owner_user_id: string | null;
  status: ApiClientStatus;
  is_first_party: boolean;
  homepage_url: string | null;
  privacy_url: string | null;
  redirect_uris: string[];
  allowed_scopes: string[];
  allowed_channels: ApiClientChannel[];
  rate_limit_tier: string;
  created_at: string;
  updated_at: string | null;
}

export interface CreateApiClientBody {
  client_id: string;
  name: string;
  description?: string | null;
  status?: ApiClientStatus;
  homepage_url?: string | null;
  privacy_url?: string | null;
  redirect_uris?: string[];
  allowed_scopes: string[];
  allowed_channels: ApiClientChannel[];
}

export interface UpdateApiClientBody {
  name?: string;
  description?: string | null;
  status?: ApiClientStatus;
  homepage_url?: string | null;
  privacy_url?: string | null;
  redirect_uris?: string[];
  allowed_scopes?: string[];
  allowed_channels?: ApiClientChannel[];
}
