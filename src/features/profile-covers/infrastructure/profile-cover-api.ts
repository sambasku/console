import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import { uploadImageToCdn } from '@/shared/api/image-upload';
import { compressImageForUpload } from '@/shared/utils/compress-image';
import {
  PROFILE_COVER_SPECS,
  type ProfileCover,
  type ProfileCoverVariant,
} from '../domain/profile-cover';

export async function listProfileCovers(
  variant: ProfileCoverVariant,
  signal?: AbortSignal,
): Promise<ProfileCover[]> {
  const res = await client.get<ApiOkEnvelope<ProfileCover[]>>(
    '/admin/profile-covers',
    { params: { variant }, signal },
  );
  return res.data.data;
}

export async function createProfileCover(body: {
  variant: ProfileCoverVariant;
  url: string;
  file_id: string;
  width: number;
  height: number;
  size_bytes: number;
  activate?: boolean;
}): Promise<ProfileCover> {
  const res = await client.post<ApiOkEnvelope<ProfileCover>>(
    '/admin/profile-covers',
    body,
  );
  return res.data.data;
}

export async function activateProfileCover(id: string): Promise<ProfileCover> {
  const res = await client.post<ApiOkEnvelope<ProfileCover>>(
    `/admin/profile-covers/${encodeURIComponent(id)}/activate`,
  );
  return res.data.data;
}

export async function deleteProfileCover(id: string): Promise<void> {
  await client.delete(`/admin/profile-covers/${encodeURIComponent(id)}`);
}

export async function uploadProfileCoverWebp(
  variant: ProfileCoverVariant,
  file: File,
): Promise<{ url: string; fileId: string; sizeBytes: number }> {
  const spec = PROFILE_COVER_SPECS[variant];
  const compressed = await compressImageForUpload(file, {
    maxWidth: spec.width,
    maxHeight: spec.height,
    quality: 0.8,
  });
  const { url, fileId } = await uploadImageToCdn(compressed, '/profile-covers');
  return { url, fileId, sizeBytes: compressed.size };
}