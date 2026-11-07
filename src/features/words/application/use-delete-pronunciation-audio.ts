import { useMutation } from '@tanstack/react-query';
import { deletePronunciationAudioRequest } from '../infrastructure/pronunciation-audio-api';

/** Soft-delete satu take word_audios. Role API: admin, editor, root. */
export function useDeletePronunciationAudio(wordId: string) {
  return useMutation({
    mutationFn: (audioId: string) => deletePronunciationAudioRequest(wordId, audioId),
  });
}
