import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';
import type {
  ApiClient,
  ApiClientStatus,
  CreateApiClientBody,
  UpdateApiClientBody,
} from '../domain/api-client';

export async function listApiClientsRequest(
  params: { status?: ApiClientStatus; is_first_party?: boolean; limit?: number },
  signal?: AbortSignal,
): Promise<{ items: ApiClient[]; next_cursor: string | null; has_more: boolean }> {
  const res = await client.get<
    ApiOkEnvelope<{ items: ApiClient[]; next_cursor: string | null; has_more: boolean }>
  >('/admin/api-clients', {
    params: {
      status: params.status,
      is_first_party:
        params.is_first_party === undefined ? undefined : String(params.is_first_party),
      limit: params.limit ?? 50,
    },
    signal,
  });
  return res.data.data;
}

export async function createApiClientRequest(body: CreateApiClientBody): Promise<ApiClient> {
  const res = await client.post<ApiOkEnvelope<ApiClient>>('/admin/api-clients', body);
  return res.data.data;
}

export async function updateApiClientRequest(
  id: string,
  body: UpdateApiClientBody,
): Promise<ApiClient> {
  const res = await client.patch<ApiOkEnvelope<ApiClient>>(`/admin/api-clients/${id}`, body);
  return res.data.data;
}
