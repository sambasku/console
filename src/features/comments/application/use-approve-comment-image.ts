import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveCommentImageRequest } from '../infrastructure/comment-api';

export function useApproveCommentImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveCommentImageRequest(id, []),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
