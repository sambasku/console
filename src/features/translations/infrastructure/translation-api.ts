import { client } from '@/shared/api/client';

export type TranslationStatus = 'pending' | 'accepted' | 'rejected';
export type TranslationReff = 'jinye';
export type TranslationResolveAction = 'approve' | 'reject';

export interface Translation {
  id: string;
  reff: TranslationReff | string;
  reffId: string;
  sourceBody: string;
  body: string;
  status: TranslationStatus;
  translatorId: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface TranslationWire {
  id: string;
  reff: string;
  reff_id: string;
  source_body: string;
  body: string;
  status: TranslationStatus;
  translator_id: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

function mapWire(w: TranslationWire): Translation {
  return {
    id: w.id,
    reff: w.reff,
    reffId: w.reff_id,
    sourceBody: w.source_body ?? '',
    body: w.body,
    status: w.status,
    translatorId: w.translator_id,
    reviewedBy: w.reviewed_by,
    reviewedAt: w.reviewed_at,
    createdAt: w.created_at,
  };
}

export async function listTranslationsRequest(
  params: {
    reff: TranslationReff;
    reffId?: string;
    status?: TranslationStatus;
    limit?: number;
  },
  signal?: AbortSignal,
): Promise<Translation[]> {
  const res = await client.get<{ data: TranslationWire[] }>('/translations', {
    params: {
      reff: params.reff,
      reff_id: params.reffId,
      status: params.status,
      limit: params.limit ?? 50,
    },
    signal,
  });
  return res.data.data.map(mapWire);
}

export async function resolveTranslationRequest(
  id: string,
  action: TranslationResolveAction,
): Promise<Translation> {
  const res = await client.post<{ data: TranslationWire }>(
    `/translations/${id}/resolve`,
    { action },
  );
  return mapWire(res.data.data);
}
