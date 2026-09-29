import { describe, expect, it } from 'vitest';
import {
  describeSuggestionChanges,
  summarizeSuggestionChanges,
} from '../../domain/describe-suggestion-changes';
import type { SuggestionDetail } from '../../domain/word-suggestion';

const current: SuggestionDetail['current_word'] = {
  lemma: 'ayam',
  notes: 'catatan lama',
  meanings: [
    {
      id: 'm1',
      word_class: { code: 'n', name: 'Nomina' },
      definition: 'unggas',
      translations: [{ translation_text: 'ayam' }],
    },
  ],
  category_ids: ['c2'],
  relations: [],
  variants: [],
  images: [],
};

describe('describeSuggestionChanges', () => {
  it('memberi label definisi, terjemahan, dan kelas kata', () => {
    const view = describeSuggestionChanges({
      proposed: {
        meanings: [
          {
            action: 'update',
            meaningId: 'm1',
            wordClassId: 'wc2',
            definition: 'orang yang kurang pandai',
            translations: [{ languageId: 'id', translationText: 'dungu' }],
          },
        ],
      },
      current,
      categoryName: (id) => id,
      wordClassName: (id) => (id === 'wc2' ? 'Verba' : id),
      relationLemma: () => undefined,
    });

    expect(view.meanings[0]?.lines).toEqual([
      { label: 'Kelas kata', before: 'Nomina', after: 'Verba' },
      { label: 'Definisi', before: 'unggas', after: 'orang yang kurang pandai' },
      { label: 'Terjemahan', before: 'ayam', after: 'dungu' },
    ]);
  });

  it('menamai kategori dan relasi, bukan id atau hitungan', () => {
    const view = describeSuggestionChanges({
      proposed: {
        categoryIdsToAdd: ['c1'],
        category_ids_to_remove: ['c2'],
        relations: [{ action: 'add', relationType: 'synonym', wordId: 'w9' }],
      },
      current,
      categoryName: (id) => (id === 'c1' ? 'Makanan' : 'Hewan'),
      wordClassName: (id) => id,
      relationLemma: (wordId) => (wordId === 'w9' ? 'bebek' : undefined),
    });

    expect(view.categories).toEqual({ added: ['Makanan'], removed: ['Hewan'] });
    expect(view.relations.added).toEqual(['Tambah sinonim: bebek']);
    expect(view.meanings).toEqual([]);
  });

  it('meringkas antrean dengan frasa, bukan shorthand', () => {
    expect(
      summarizeSuggestionChanges({
        lemma: 'bebek',
        notes: null,
        meanings_count: 2,
        categories_added: 1,
        categories_removed: 0,
        relations_count: 0,
        variants_count: 0,
        images_count: 1,
      }),
    ).toBe('ubah kata, 2 makna, kategori, gambar');
  });
});
