import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listJinyeRequest,
  takedownJinyeRequest,
  type JinyeStatus,
} from '../infrastructure/jinye-api';

export function useJinyeList(params: {
  status?: JinyeStatus;
  username?: string;
}) {
  return useQuery({
    queryKey: ['jinye', params],
    queryFn: ({ signal }) => listJinyeRequest(params, signal),
    staleTime: 15_000,
  });
}

export function useTakedownJinye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: takedownJinyeRequest,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['jinye'] });
      void qc.invalidateQueries({ queryKey: ['jinye-reports'] });
    },
  });
}
