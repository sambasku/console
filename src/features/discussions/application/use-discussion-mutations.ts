import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approveDiscussionRequest,
  pinDiscussionReplyRequest,
  rejectDiscussionRequest,
  takedownDiscussionReplyRequest,
  takedownDiscussionRequest,
} from '../infrastructure/discussion-api';
import type { DiscussionListItem, DiscussionReply } from '../domain/discussion';

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['discussions'] });
}

export function useApproveDiscussion() {
  const queryClient = useQueryClient();
  return useMutation<
    DiscussionListItem,
    Error,
    {
      id: string;
      censoredFiles?: (Blob | null)[];
      contentWarnings?: string[][];
    }
  >({
    mutationFn: ({ id, censoredFiles, contentWarnings }) =>
      approveDiscussionRequest(id, { censoredFiles, contentWarnings }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useRejectDiscussion() {
  const queryClient = useQueryClient();
  return useMutation<DiscussionListItem, Error, { id: string; note: string }>({
    mutationFn: ({ id, note }) => rejectDiscussionRequest(id, note),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useTakedownDiscussion() {
  const queryClient = useQueryClient();
  return useMutation<DiscussionListItem, Error, { id: string }>({
    mutationFn: ({ id }) => takedownDiscussionRequest(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function usePinDiscussionReply() {
  const queryClient = useQueryClient();
  return useMutation<DiscussionListItem, Error, { discussionId: string; replyId: string }>({
    mutationFn: ({ discussionId, replyId }) => pinDiscussionReplyRequest(discussionId, replyId),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useTakedownDiscussionReply() {
  const queryClient = useQueryClient();
  return useMutation<DiscussionReply, Error, { replyId: string }>({
    mutationFn: ({ replyId }) => takedownDiscussionReplyRequest(replyId),
    onSuccess: () => invalidateAll(queryClient),
  });
}
