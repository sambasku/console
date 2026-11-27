import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearAdminWordOfDay,
  getAdminWordOfDay,
  listWordOfDayHistory,
  setAdminWordOfDay,
} from '../infrastructure/word-of-day-admin-api';

const adminKey = (date: string) => ['admin-word-of-day', date] as const;
const historyKey = ['admin-word-of-day-history'] as const;

export function useAdminWordOfDay(date: string, enabled = true) {
  return useQuery({
    queryKey: adminKey(date),
    queryFn: ({ signal }) => getAdminWordOfDay(date, signal),
    enabled: enabled && Boolean(date),
  });
}

export function useWordOfDayHistory(enabled = true) {
  return useQuery({
    queryKey: historyKey,
    queryFn: ({ signal }) => listWordOfDayHistory(30, signal),
    enabled,
  });
}

export function useSetAdminWordOfDay(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setAdminWordOfDay,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKey(date) });
      void qc.invalidateQueries({ queryKey: historyKey });
      void qc.invalidateQueries({ queryKey: ['word-of-day'] });
    },
  });
}

export function useClearAdminWordOfDay(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: string) => clearAdminWordOfDay(d),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKey(date) });
      void qc.invalidateQueries({ queryKey: historyKey });
      void qc.invalidateQueries({ queryKey: ['word-of-day'] });
    },
  });
}