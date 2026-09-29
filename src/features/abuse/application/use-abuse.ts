import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { normalizeError } from '@/shared/api/error';
import { useCursorList } from '@/shared/hooks/use-cursor-list';
import type { AnonSubjectKind, AnonAbuseEvent, UserAbuseEvent, UserAbuseHistoryItem } from '../domain/abuse';
import {
  liftAnonMuteRequest,
  liftUserMuteRequest,
  listAnonAbuseEventsRequest,
  listAnonMutesRequest,
  listUserAbuseEventsRequest,
  listUserAbuseHistoryRequest,
} from '../infrastructure/abuse-api';

export interface UserAbuseFilters {
  signal?: string;
  userName?: string;
}

export interface AnonAbuseFilters {
  subjectKind?: AnonSubjectKind;
  subjectKey?: string;
  signal?: string;
}

export function useUserAbuseEvents(filters: UserAbuseFilters, enabled: boolean) {
  return useCursorList<UserAbuseEvent>({
    queryKey: ['abuse', 'user-events', filters],
    fetcher: (cursor, signal) => listUserAbuseEventsRequest({ ...filters, cursor }, signal),
    enabled,
  });
}

export function useAnonAbuseEvents(filters: AnonAbuseFilters, enabled: boolean) {
  return useCursorList<AnonAbuseEvent>({
    queryKey: ['abuse', 'anon-events', filters],
    fetcher: (cursor, signal) => listAnonAbuseEventsRequest({ ...filters, cursor }, signal),
    enabled,
  });
}

export function useAnonMutes(enabled: boolean) {
  return useQuery({
    queryKey: ['abuse', 'anon-mutes'],
    queryFn: ({ signal }) => listAnonMutesRequest(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useUserAbuseHistory(userId: string | undefined) {
  return useCursorList<UserAbuseHistoryItem>({
    queryKey: ['abuse', 'user-history', userId],
    fetcher: (cursor, signal) => listUserAbuseHistoryRequest(userId!, cursor, signal),
    enabled: !!userId,
  });
}

export function useLiftUserMute() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (vars: { userId: string; username: string }) => liftUserMuteRequest(vars.userId),
    onSuccess: async (_, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['abuse'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      ]);
      message.success(`Mute ${vars.username} dicabut dan skor abuse direset.`);
    },
    onError: (err) => {
      message.warning(normalizeError(err).message || 'Gagal mencabut mute');
    },
  });
}

export function useLiftAnonMute() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (vars: { subjectKind: AnonSubjectKind; subjectKey: string }) =>
      liftAnonMuteRequest(vars.subjectKind, vars.subjectKey),
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['abuse'] });
      message.success(`Mute ${vars.subjectKey} dicabut dan skor abuse direset.`);
    },
    onError: (err) => {
      message.warning(normalizeError(err).message || 'Gagal mencabut mute');
    },
  });
}
