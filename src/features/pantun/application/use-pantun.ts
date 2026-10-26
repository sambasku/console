import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listPantunsRequest,
  takedownPantunRequest,
} from '../infrastructure/pantun-api';

export function usePantuns() {
  return useQuery({
    queryKey: ['pantuns'],
    queryFn: ({ signal }) => listPantunsRequest(signal),
    staleTime: 15_000,
  });
}

export function useTakedownPantun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: takedownPantunRequest,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pantuns'] });
    },
  });
}
