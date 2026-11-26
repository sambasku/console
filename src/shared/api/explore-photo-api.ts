import { client } from './client';
import type { ApiOkEnvelope } from './types';

export type ExplorePhotoModule = 'place' | 'culinary' | 'usaha' | 'event';

export async function takedownExplorePhotoRequest(
  module: ExplorePhotoModule,
  entityId: string,
  target: { imageId?: string; imageUrl?: string },
): Promise<{ url: string }> {
  const res = await client.post<ApiOkEnvelope<{ url: string }>>(
    `/admin/explore-photos/${module}/${entityId}/takedown`,
    {
      image_id: target.imageId,
      image_url: target.imageUrl,
    },
  );
  return res.data.data;
}

export async function censorExplorePhotoRequest(
  module: ExplorePhotoModule,
  entityId: string,
  input: { imageId?: string; imageUrl?: string; blob: Blob },
): Promise<{ old_url: string; url: string }> {
  const form = new FormData();
  form.append('image', input.blob, 'censored.webp');
  if (input.imageId) form.append('image_id', input.imageId);
  if (input.imageUrl) form.append('image_url', input.imageUrl);
  const res = await client.post<ApiOkEnvelope<{ old_url: string; url: string }>>(
    `/admin/explore-photos/${module}/${entityId}/censor`,
    form,
  );
  return res.data.data;
}
