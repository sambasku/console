import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rejectCommentImageRequest } from '../infrastructure/comment-api';

export function useRejectCommentImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, abusive }: { id: string; abusive?: boolean }) =>
      rejectCommentImageRequest(id, abusive === true),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
