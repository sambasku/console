import {
  RELATION_TYPE_LABELS,
  VARIANT_TYPE_LABELS,
  type RelationType,
  type VariantType,
} from '@/features/words/domain/create-word';
import type { SuggestionDetail, SuggestionListItem } from './word-suggestion';

/** Satu baris sebelum → sesudah. `before` atau `after` null = hanya sisi itu. */
export interface ReplaceLine {
  label: string;
  before: string | null;
  after: string | null;
}

export interface MeaningChangeBlock {
  heading: string;
  lines: ReplaceLine[];
}

export interface SuggestionChangeView {
  texts: ReplaceLine[];
  meanings: MeaningChangeBlock[];
  categories: { added: string[]; removed: string[] };
  relations: { added: string[]; removed: string[] };
  variants: { added: string[]; removed: string[] };
}

export interface DescribeSuggestionInput {
  proposed: Record<string, unknown>;
  current: SuggestionDetail['current_word'];
  categoryName: (id: string) => string;
  wordClassName: (id: string) => string;
  relationLemma: (wordId: string) => string | undefined;
}

/**
 * Kalimat review dari payload usulan, bukan dari array diff yang kehilangan nama field.
 * Hanya bagian yang benar-benar beda dengan kata saat ini.
 */
export function describeSuggestionChanges(input: DescribeSuggestionInput): SuggestionChangeView {
  const { proposed, current } = input;
  const texts: ReplaceLine[] = [];

  const lemma = pickString(proposed, 'lemma');
  if (lemma !== undefined && lemma !== current.lemma) {
    texts.push({ label: 'Kata', before: current.lemma, after: lemma });
  }
  const notes = pickString(proposed, 'notes');
  if (notes !== undefined && notes !== (current.notes ?? '')) {
    texts.push({ label: 'Catatan', before: current.notes, after: notes });
  }

  const meanings = parseMeanings(proposed.meanings ?? proposed['meanings']).map((change) =>
    describeMeaning(change, current, input.wordClassName),
  );

  const currentCategories = new Set(current.category_ids);
  const categories = {
    added: uniqueStrings(pickStringList(proposed, 'categoryIdsToAdd', 'category_ids_to_add'))
      .filter((id) => !currentCategories.has(id))
      .map(input.categoryName)
      .filter((name) => name.trim().length > 0),
    removed: uniqueStrings(pickStringList(proposed, 'categoryIdsToRemove', 'category_ids_to_remove'))
      .filter((id) => currentCategories.has(id))
      .map(input.categoryName)
      .filter((name) => name.trim().length > 0),
  };

  const relations = { added: [] as string[], removed: [] as string[] };
  for (const relation of parseRelations(proposed.relations)) {
    const phrase = relationPhrase(relation.relationType, input.relationLemma(relation.wordId));
    if (relation.action === 'add') relations.added.push(`Tambah ${phrase}`);
    if (relation.action === 'remove') relations.removed.push(`Hapus ${phrase}`);
  }

  const variants = { added: [] as string[], removed: [] as string[] };
  for (const variant of parseVariants(proposed.variants)) {
    const phrase = variantPhrase(variant.variantType, variant.form);
    if (variant.action === 'add') variants.added.push(`Tambah ${phrase}`);
    if (variant.action === 'remove') variants.removed.push(`Hapus ${phrase}`);
  }

  return { texts, meanings: meanings.filter((block) => block.lines.length > 0 || block.heading === 'Makna dihapus'), categories, relations, variants };
}

export function suggestionChangesAreEmpty(view: SuggestionChangeView): boolean {
  return (
    view.texts.length === 0 &&
    view.meanings.length === 0 &&
    view.categories.added.length === 0 &&
    view.categories.removed.length === 0 &&
    view.relations.added.length === 0 &&
    view.relations.removed.length === 0 &&
    view.variants.added.length === 0 &&
    view.variants.removed.length === 0
  );
}

/** Frasa kolom ringkasan antrean. Bukan shorthand `makna×2`. */
export function summarizeSuggestionChanges(summary: SuggestionListItem['summary_changes']): string {
  const parts: string[] = [];
  if (summary.lemma) parts.push('ubah kata');
  if (summary.notes) parts.push('ubah catatan');
  if (summary.meanings_count === 1) parts.push('1 makna');
  else if (summary.meanings_count > 1) parts.push(`${summary.meanings_count} makna`);
  if (summary.categories_added || summary.categories_removed) parts.push('kategori');
  if (summary.relations_count) parts.push('relasi');
  if (summary.variants_count) parts.push('varian');
  if (summary.images_count) parts.push('gambar');
  return parts.join(', ') || '-';
}

function describeMeaning(
  change: ParsedMeaning,
  current: SuggestionDetail['current_word'],
  wordClassName: (id: string) => string,
): MeaningChangeBlock {
  if (change.action === 'add') {
    const lines: ReplaceLine[] = [];
    const nextClass = change.wordClassId ? wordClassName(change.wordClassId).trim() : '';
    if (nextClass) {
      lines.push({ label: 'Kelas kata', before: null, after: nextClass });
    }
    if (change.definition !== undefined) {
      lines.push({ label: 'Definisi', before: null, after: change.definition });
    }
    const translation = joinTexts(change.translations.map((item) => item.translationText));
    if (translation) lines.push({ label: 'Terjemahan', before: null, after: translation });
    return { heading: 'Makna baru', lines };
  }

  const existing = change.meaningId
    ? current.meanings.find((meaning) => meaning.id === change.meaningId)
    : undefined;

  if (change.action === 'delete') {
    if (!existing) return { heading: 'Makna dihapus', lines: [] };
    const lines: ReplaceLine[] = [
      { label: 'Definisi', before: existing.definition, after: null },
    ];
    const translation = joinTexts(existing.translations.map((item) => item.translation_text));
    if (translation) lines.push({ label: 'Terjemahan', before: translation, after: null });
    return { heading: 'Makna dihapus', lines };
  }

  const className = existing?.word_class?.name ?? null;
  const lines: ReplaceLine[] = [];
  if (change.wordClassId) {
    const nextClass = wordClassName(change.wordClassId).trim();
    if (nextClass && nextClass !== className) {
      lines.push({ label: 'Kelas kata', before: className, after: nextClass });
    }
  }
  if (change.definition !== undefined && change.definition !== existing?.definition) {
    lines.push({
      label: 'Definisi',
      before: existing?.definition ?? null,
      after: change.definition,
    });
  }
  if (change.translations.length > 0) {
    const before = joinTexts(existing?.translations.map((item) => item.translation_text) ?? []);
    const after = joinTexts(change.translations.map((item) => item.translationText));
    if (after && after !== before) {
      lines.push({ label: 'Terjemahan', before: before || null, after });
    }
  }

  const heading = className ? `Makna (${className})` : 'Makna';
  return { heading, lines };
}

function relationPhrase(relationType: string, lemma: string | undefined): string {
  const label =
    RELATION_TYPE_LABELS[relationType as RelationType] ?? relationType;
  const target = lemma?.trim() || 'kata terkait';
  return `${label.toLocaleLowerCase('id')}: ${target}`;
}

function variantPhrase(variantType: string, form: string): string {
  const label = VARIANT_TYPE_LABELS[variantType as VariantType] ?? variantType;
  return `${label.toLocaleLowerCase('id')}: ${form}`;
}

interface ParsedMeaning {
  action: string;
  meaningId?: string;
  wordClassId?: string;
  definition?: string;
  translations: Array<{ translationText: string }>;
}

function parseMeanings(raw: unknown): ParsedMeaning[] {
  if (!Array.isArray(raw)) return [];
  const parsed: ParsedMeaning[] = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) continue;
    const action = pickString(row, 'action');
    if (!action) continue;
    parsed.push({
      action,
      meaningId: pickString(row, 'meaningId', 'meaning_id'),
      wordClassId: pickString(row, 'wordClassId', 'word_class_id'),
      definition: pickString(row, 'definition'),
      translations: parseTranslations(row.translations),
    });
  }
  return parsed;
}

function parseTranslations(raw: unknown): Array<{ translationText: string }> {
  if (!Array.isArray(raw)) return [];
  const texts: Array<{ translationText: string }> = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) continue;
    const translationText = pickString(row, 'translationText', 'translation_text');
    if (!translationText?.trim()) continue;
    texts.push({ translationText });
  }
  return texts;
}

function parseRelations(raw: unknown): Array<{ action: string; relationType: string; wordId: string }> {
  if (!Array.isArray(raw)) return [];
  const rows: Array<{ action: string; relationType: string; wordId: string }> = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) continue;
    const action = pickString(row, 'action');
    const relationType = pickString(row, 'relationType', 'relation_type');
    const wordId = pickString(row, 'wordId', 'word_id');
    if (!action || !relationType || !wordId) continue;
    rows.push({ action, relationType, wordId });
  }
  return rows;
}

function parseVariants(raw: unknown): Array<{ action: string; form: string; variantType: string }> {
  if (!Array.isArray(raw)) return [];
  const rows: Array<{ action: string; form: string; variantType: string }> = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) continue;
    const action = pickString(row, 'action');
    const form = pickString(row, 'form');
    if (!action || !form) continue;
    rows.push({
      action,
      form,
      variantType: pickString(row, 'variantType', 'variant_type') ?? 'alternative',
    });
  }
  return rows;
}

function pickStringList(obj: Record<string, unknown>, camel: string, snake: string): string[] {
  const value = obj[camel] ?? obj[snake];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (!(key in obj)) continue;
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function joinTexts(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(', ');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
