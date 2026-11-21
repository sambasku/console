import { useCursorList } from '@/shared/hooks/use-cursor-list';
import { listWordsRequest } from '../infrastructure/word-api';
import type { WordListItem, WordType } from '../domain/word';

const PAGE_LIMIT = 20;

export interface UseWordListArgs {
  q?: string;
  wordType?: WordType;
  isVerified?: boolean;
  published?: boolean;
  hasImage?: boolean;
  needsReview?: boolean;
  enabled?: boolean;
}

/**
 * List kata admin: `q` untuk penelusuran lemma (debounce dilakukan di UI),
 * filter `wordType`/`isVerified`/`published`/`hasImage`/`needsReview`.
 * Kunci query menyertakan SEMUA filter - filter berubah ⇒ halaman 1.
 */
export function useWordList(args: UseWordListArgs = {}) {
  const { q, wordType, isVerified, published, hasImage, needsReview, enabled } = args;

  return useCursorList<WordListItem>({
    queryKey: ['words', { q, wordType, isVerified, published, hasImage, needsReview }],
    fetcher: (pageParam, signal) =>
      listWordsRequest(
        {
          q,
          wordType,
          isVerified,
          published,
          hasImage,
          needsReview,
          limit: PAGE_LIMIT,
          cursor: pageParam,
        },
        signal,
      ),
    enabled,
  });
}
