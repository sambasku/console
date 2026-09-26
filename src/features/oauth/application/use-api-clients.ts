import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createApiClientRequest,
  listApiClientsRequest,
  updateApiClientRequest,
} from '../infrastructure/api-client-api';
import type { ApiClientStatus, CreateApiClientBody, UpdateApiClientBody } from '../domain/api-client';

const listKey = ['admin-api-clients'] as const;

export function useApiClients(enabled: boolean, status?: ApiClientStatus) {
  return useQuery({
    queryKey: [...listKey, status ?? 'all'],
    queryFn: ({ signal }) => listApiClientsRequest({ status, limit: 100 }, signal),
    enabled,
  });
}

export function useApiClientMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: listKey });
  };

  return {
    create: useMutation({
      mutationFn: (body: CreateApiClientBody) => createApiClientRequest(body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateApiClientBody }) =>
        updateApiClientRequest(id, body),
      onSuccess: invalidate,
    }),
  };
}
