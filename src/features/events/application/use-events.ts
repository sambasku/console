import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCursorList } from '@/shared/hooks/use-cursor-list';
import type { Event, EventStatus } from '../domain/event';
import {
  createEventRequest,
  deleteEventRequest,
  listEventCategoriesRequest,
  listEventsRequest,
  setEventCancelledRequest,
  updateEventRequest,
  type EventInput,
} from '../infrastructure/event-api';
import {
  approveEventContributionRequest,
  listPendingEventContributionsRequest,
  rejectEventContributionRequest,
  requestEventRevisionRequest,
} from '../infrastructure/event-contribution-api';

const PAGE_LIMIT = 30;

export function useEventList(
  enabled = true,
  filters: {
    q?: string;
    category_id?: string;
    status?: EventStatus;
    order?: 'asc' | 'desc';
    not_ended?: '1';
  } = {},
) {
  return useCursorList<Event>({
    queryKey: ['events', filters],
    enabled,
    fetcher: async (cursor, signal) => {
      const page = await listEventsRequest(
        {
          limit: PAGE_LIMIT,
          before: cursor,
          q: filters.q,
          category_id: filters.category_id,
          status: filters.status,
          order: filters.order,
          not_ended: filters.not_ended,
        },
        signal,
      );
      return {
        data: page.items,
        meta: {
          limit: PAGE_LIMIT,
          next_cursor: page.nextCursor,
          has_more: page.nextCursor != null,
        },
      };
    },
  });
}

/** Katalog kategori acara untuk form select + filter. */
export function useEventCategories(enabled = true) {
  return useQuery({
    queryKey: ['events', 'categories'],
    queryFn: ({ signal }) => listEventCategoriesRequest(signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEventRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<EventInput>) =>
      updateEventRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEventRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

/** Batal / pulihkan acara. */
export function useSetEventCancelled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancelled }: { id: string; cancelled: boolean }) =>
      setEventCancelledRequest(id, cancelled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

/** Usulan acara yang menunggu tinjauan. */
export function usePendingEventContributions(enabled = true) {
  return useQuery({
    queryKey: ['events', 'contributions', 'pending'],
    queryFn: ({ signal }) => listPendingEventContributionsRequest(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useReviewEventContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
      note,
    }: {
      id: string;
      action: 'approve' | 'reject' | 'request-revision';
      reason?: { reason_code: string; reason_text?: string };
      note?: string;
    }) => {
      if (action === 'approve') return approveEventContributionRequest(id);
      if (action === 'reject') {
        return rejectEventContributionRequest(id, reason ?? { reason_code: 'other' });
      }
      return requestEventRevisionRequest(id, note ?? '');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
