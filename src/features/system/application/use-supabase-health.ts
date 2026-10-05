import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listSupabaseHealthChecksRequest,
  triggerSupabasePingRequest,
} from '../infrastructure/supabase-health-api';

const listKey = ['admin-supabase-health-checks'] as const;

export function useSupabaseHealthChecks(enabled: boolean, env?: string) {
  return useQuery({
    queryKey: [...listKey, env ?? 'all'],
    queryFn: ({ signal }) => listSupabaseHealthChecksRequest({ limit: 50, env }, signal),
    enabled,
    // Keep-alive cuma jalan 2x seminggu - poll ringan cukup saat halaman dibuka.
    refetchInterval: 60_000,
  });
}

export function useTriggerSupabasePing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => triggerSupabasePingRequest(),
    // Ping menulis baris log baru - refresh riwayat.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
