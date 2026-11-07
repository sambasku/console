import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type { WordVoterWire, WordVotersMeta } from '../domain/word-voters';

export interface ListWordVotersParams {
  wordId: string;
  meaningId?: string;
  value?: 1 | -1;
  limit?: number;
  cursor?: string;
}

export interface ListWordVotersPage {
  data: WordVoterWire[];
  meta: WordVotersMeta;
}

/**
 * GET /api/v1/admin/words/:wordId/voters - daftar voter makna kata
 * (root/admin/reviewer).
 */
export async function listWordVotersRequest(
  params: ListWordVotersParams,
  signal?: AbortSignal,
): Promise<ListWordVotersPage> {
  const res = await client.get<ApiOkEnvelope<WordVoterWire[]> & { meta: WordVotersMeta }>(
    `/admin/words/${params.wordId}/voters`,
    {
      params: {
        meaning_id: params.meaningId || undefined,
        value: params.value,
        limit: params.limit ?? 20,
        cursor: params.cursor,
      },
      signal,
    },
  );
  return { data: res.data.data, meta: res.data.meta };
}
