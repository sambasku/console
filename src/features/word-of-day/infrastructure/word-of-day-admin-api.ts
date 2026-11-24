import { client } from '@/shared/api/client';
import type { ApiOkEnvelope } from '@/shared/api/types';

export type WordOfDayAdminSource = 'manual' | 'algorithm' | 'empty';

export interface WordOfDayAdminView {
  date: string;
  word_id: string | null;
  lemma: string | null;
  source: WordOfDayAdminSource;
  updated_at: string | null;
  updated_by: string | null;
}

export async function getAdminWordOfDay(
  date?: string,
  signal?: AbortSignal,
): Promise<WordOfDayAdminView> {
  const res = await client.get<ApiOkEnvelope<WordOfDayAdminView>>(
    '/admin/word-of-day',
    { params: date ? { date } : undefined, signal },
  );
  return res.data.data;
}

export type WordOfDayHistoryRow = WordOfDayAdminView & {
  word_id: string;
  source: 'manual' | 'algorithm';
};

export async function listWordOfDayHistory(
  limit = 30,
  signal?: AbortSignal,
): Promise<WordOfDayHistoryRow[]> {
  const res = await client.get<ApiOkEnvelope<WordOfDayHistoryRow[]>>(
    '/admin/word-of-day/history',
    { params: { limit }, signal },
  );
  return res.data.data;
}

export async function setAdminWordOfDay(body: {
  date: string;
  word_id: string;
}): Promise<WordOfDayAdminView> {
  const res = await client.put<ApiOkEnvelope<WordOfDayAdminView>>(
    '/admin/word-of-day',
    body,
  );
  return res.data.data;
}

export async function clearAdminWordOfDay(date: string): Promise<void> {
  await client.delete('/admin/word-of-day', { params: { date } });
}