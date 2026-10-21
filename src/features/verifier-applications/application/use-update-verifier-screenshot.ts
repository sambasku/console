import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVerifierScreenshotRequest } from '../infrastructure/verifier-application-api';

/** Admin/root mengganti screenshot satu akun sosial pengajuan (issue #50). */
export function useUpdateVerifierScreenshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, index, url, providerFileId }: {
      id: string;
      index: number;
      url: string;
      providerFileId: string;
    }) =>
      updateVerifierScreenshotRequest(id, index, {
        url,
        provider_file_id: providerFileId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifier-applications'] });
    },
  });
}
