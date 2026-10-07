import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAnnouncementRequest,
  deleteAnnouncementRequest,
  listAnnouncementsRequest,
  updateAnnouncementRequest,
  type AnnouncementInput,
} from '../infrastructure/announcement-api';

export function useAnnouncementList(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['announcements'],
    queryFn: ({ pageParam, signal }) =>
      listAnnouncementsRequest({ limit: 20, before: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAnnouncementRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<AnnouncementInput>) =>
      updateAnnouncementRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAnnouncementRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}
