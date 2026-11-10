import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTranslationsRequest,
  resolveTranslationRequest,
  type TranslationReff,
  type TranslationResolveAction,
  type TranslationStatus,
} from '../infrastructure/translation-api';

export function useTranslations(params: {
  reff: TranslationReff;
  status?: TranslationStatus;
}) {
  return useQuery({
    queryKey: ['translations', params],
    queryFn: ({ signal }) =>
      listTranslationsRequest(
        {
          reff: params.reff,
          status: params.status,
          limit: 50,
        },
        signal,
      ),
    staleTime: 15_000,
  });
}

export function useResolveTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; action: TranslationResolveAction }) =>
      resolveTranslationRequest(params.id, params.action),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['translations'] });
    },
  });
}
